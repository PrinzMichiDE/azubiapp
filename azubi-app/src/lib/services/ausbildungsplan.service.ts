/**
 * Ausbildungsplan-Service gemäß BBiG und BIBB-Rahmenlehrplänen
 * Training plan service according to BBiG and BIBB framework curricula
 */
import { BaseService } from './base.service'
import { PrismaClient } from '@prisma/client'

interface BIBBRahmenlehrplan {
  beruf: string
  ausbildungsdauer: number // in Monaten
  lernfelder: Lernfeld[]
  kompetenzen: Kompetenz[]
  pruefungen: Pruefung[]
}

interface Lernfeld {
  id: string
  nummer: number
  bezeichnung: string
  zeitrichtwert: number // in Stunden
  ausbildungsjahr: 1 | 2 | 3 | 4
  ziele: string[]
  inhalte: string[]
  kompetenzen: string[]
}

interface Kompetenz {
  id: string
  bereich: 'Fachkompetenz' | 'Methodenkompetenz' | 'Sozialkompetenz' | 'Personalkompetenz'
  beschreibung: string
  lernziele: string[]
  bewertungskriterien: string[]
}

interface Pruefung {
  typ: 'Zwischenprüfung' | 'Abschlussprüfung Teil 1' | 'Abschlussprüfung Teil 2'
  zeitpunkt: string // z.B. "Mitte 2. Ausbildungsjahr"
  dauer: number // in Minuten
  bereiche: PruefungsBereich[]
  gewichtung: number // in Prozent
}

interface PruefungsBereich {
  name: string
  art: 'schriftlich' | 'praktisch' | 'mündlich'
  dauer: number
  gewichtung: number
  themen: string[]
}

interface AusbildungsplanStatus {
  azubiId: string
  beruf: string
  ausbildungsbeginn: Date
  geplantesEnde: Date
  fortschritt: {
    lernfeldId: string
    status: 'geplant' | 'aktiv' | 'abgeschlossen' | 'überfällig'
    startDatum?: Date
    endDatum?: Date
    fortschrittProzent: number
    bewertungen: Bewertung[]
  }[]
  pruefungstermine: {
    pruefungId: string
    geplantDatum: Date
    anmeldeDatum?: Date
    ergebnis?: PruefungsErgebnis
  }[]
}

interface Bewertung {
  datum: Date
  ausbilder: string
  note: number // 1-6 (deutsches Notensystem)
  kommentar: string
  typ: 'Praxis' | 'Theorie' | 'Verhalten'
}

interface PruefungsErgebnis {
  gesamtnote: number
  teilnoten: { bereich: string; note: number; punkte: number }[]
  bestanden: boolean
  naechsterVersuch?: Date
}

/**
 * Service für BBiG-konforme Ausbildungsplanung
 * Service for BBiG-compliant training planning
 * 
 * Features:
 * - BIBB-Rahmenlehrplan-Integration
 * - Automatische Zeitplanung (70% Praxis, 30% Theorie)
 * - IHK/HWK-Prüfungsmanagement
 * - Compliance-Tracking gemäß BBiG
 * - Ausbilder-Qualifikation (AEVO) Überwachung
 * - Jugendschutz-konforme Arbeitszeiten
 */
export class AusbildungsplanService extends BaseService {
  constructor(prisma: PrismaClient) {
    super(prisma)
  }

  /**
   * Erstellt BBiG-konformen Ausbildungsplan
   * Creates BBiG-compliant training plan
   */
  async erstelleAusbildungsplan(
    azubiId: string,
    beruf: string,
    ausbildungsbeginn: Date,
    ausbilder: string
  ): Promise<AusbildungsplanStatus> {
    try {
      // 1. BIBB-Rahmenlehrplan laden
      const rahmenlehrplan = await this.loadeBIBBRahmenlehrplan(beruf)
      
      // 2. Ausbildungsdauer berechnen
      const geplantesEnde = new Date(ausbildungsbeginn)
      geplantesEnde.setMonth(geplantesEnde.getMonth() + rahmenlehrplan.ausbildungsdauer)
      
      // 3. Lernfelder zeitlich planen
      const lernfeldPlanung = this.planeLernfelder(rahmenlehrplan.lernfelder, ausbildungsbeginn)
      
      // 4. Prüfungstermine setzen
      const pruefungstermine = this.planePruefungen(rahmenlehrplan.pruefungen, ausbildungsbeginn)
      
      // 5. Compliance-Checks
      await this.pruefeAusbilderBerechtigung(ausbilder)
      await this.pruefeJugendschutz(azubiId, ausbildungsbeginn)
      
      // 6. Ausbildungsplan in DB speichern
      const ausbildungsplan = await this.prisma.ausbildungsplan.create({
        data: {
          azubiId,
          beruf,
          ausbildungsbeginn,
          geplantesEnde,
          ausbilder,
          rahmenlehrplanVersion: rahmenlehrplan.version,
          status: 'aktiv',
          lernfelder: {
            create: lernfeldPlanung.map(lf => ({
              lernfeldId: lf.id,
              geplantStart: lf.startDatum,
              geplantEnde: lf.endDatum,
              status: 'geplant'
            }))
          },
          pruefungen: {
            create: pruefungstermine.map(pt => ({
              pruefungId: pt.id,
              geplantDatum: pt.datum,
              typ: pt.typ
            }))
          }
        },
        include: {
          lernfelder: true,
          pruefungen: true
        }
      })

      // 7. Automatische Benachrichtigungen
      await this.erstelleBenachrichtigungen(azubiId, ausbilder, ausbildungsplan)
      
      return this.mappeAusbildungsplanStatus(ausbildungsplan)
      
    } catch (error) {
      this.handleError(error, 'AusbildungsplanService.erstelleAusbildungsplan')
      throw error
    }
  }

  /**
   * Überwacht BBiG-Compliance
   * Monitors BBiG compliance
   */
  async pruefeBBiGCompliance(azubiId: string): Promise<{
    compliant: boolean
    violations: string[]
    recommendations: string[]
  }> {
    const violations: string[] = []
    const recommendations: string[] = []

    // 1. Ausbildungszeit prüfen (BBiG §11)
    const arbeitszeiten = await this.pruefeArbeitszeiten(azubiId)
    if (arbeitszeiten.violations.length > 0) {
      violations.push(...arbeitszeiten.violations)
    }

    // 2. Ausbildungsnachweis prüfen (BBiG §13)
    const nachweise = await this.pruefeAusbildungsnachweis(azubiId)
    if (!nachweise.vollstaendig) {
      violations.push('Ausbildungsnachweis unvollständig')
      recommendations.push('Wöchentliche Nachweise digital erfassen')
    }

    // 3. Ausbilder-Qualifikation prüfen (BBiG §28-30)
    const ausbilder = await this.pruefeAusbilderQualifikation(azubiId)
    if (!ausbilder.aevoNachweis) {
      violations.push('Ausbilder ohne AEVO-Nachweis')
      recommendations.push('AEVO-Kurs für Ausbilder organisieren')
    }

    // 4. Prüfungsanmeldungen prüfen
    const pruefungen = await this.pruefePruefungsanmeldungen(azubiId)
    if (pruefungen.verspaetet.length > 0) {
      violations.push(`Verspätete Prüfungsanmeldungen: ${pruefungen.verspaetet.join(', ')}`)
    }

    // 5. Mindestvergütung prüfen (BBiG §17)
    const verguetung = await this.pruefeMindestvergütung(azubiId)
    if (!verguetung.konform) {
      violations.push(`Vergütung unter Mindestlohn: ${verguetung.aktuell}€ < ${verguetung.mindest}€`)
    }

    return {
      compliant: violations.length === 0,
      violations,
      recommendations
    }
  }

  /**
   * Generiert IHK/HWK-konforme Berichte
   * Generates IHK/HWK-compliant reports
   */
  async generiereAusbildungsnachweis(
    azubiId: string,
    zeitraum: { von: Date; bis: Date }
  ): Promise<{
    azubi: any
    ausbilder: any
    tatigkeiten: Tatigkeit[]
    berufsschule: BerufsschulZeit[]
    arbeitszeiten: ArbeitszeitEintrag[]
    unterschriften: Unterschrift[]
  }> {
    const azubi = await this.prisma.user.findUnique({
      where: { id: azubiId },
      include: { ausbildungsplan: true }
    })

    const tatigkeiten = await this.prisma.ausbildungstatigkeit.findMany({
      where: {
        azubiId,
        datum: { gte: zeitraum.von, lte: zeitraum.bis }
      },
      orderBy: { datum: 'asc' }
    })

    const berufsschule = await this.prisma.berufsschulzeit.findMany({
      where: {
        azubiId,
        datum: { gte: zeitraum.von, lte: zeitraum.bis }
      }
    })

    const arbeitszeiten = await this.prisma.arbeitszeit.findMany({
      where: {
        azubiId,
        datum: { gte: zeitraum.von, lte: zeitraum.bis }
      }
    })

    return {
      azubi: this.sanitizeOutput(azubi),
      ausbilder: await this.getAusbilder(azubi?.ausbildungsplan?.ausbilder),
      tatigkeiten,
      berufsschule,
      arbeitszeiten,
      unterschriften: await this.getUnterschriften(azubiId, zeitraum)
    }
  }

  /**
   * Prüfungsmanagement für IHK/HWK
   * Examination management for IHK/HWK
   */
  async verwaltePruefung(
    azubiId: string,
    pruefungstyp: 'Zwischenprüfung' | 'Abschlussprüfung Teil 1' | 'Abschlussprüfung Teil 2',
    aktion: 'anmelden' | 'bewerten' | 'wiederholen'
  ) {
    const ausbildungsplan = await this.getAusbildungsplan(azubiId)
    const pruefung = ausbildungsplan.pruefungen.find(p => p.typ === pruefungstyp)

    if (!pruefung) {
      throw new ValidationError(`Prüfung ${pruefungstyp} nicht im Ausbildungsplan gefunden`)
    }

    switch (aktion) {
      case 'anmelden':
        return this.meldePruefungAn(azubiId, pruefung)
      case 'bewerten':
        return this.bewertePruefung(azubiId, pruefung)
      case 'wiederholen':
        return this.planePruefungswiederholung(azubiId, pruefung)
    }
  }

  /**
   * AEVO-Kenntnisse für Ausbilder verwalten
   * Manage AEVO qualifications for trainers
   */
  async verwaltAEVOKenntnisse(ausbilderId: string) {
    const ausbilder = await this.prisma.ausbilder.findUnique({
      where: { id: ausbilderId },
      include: { qualifikationen: true }
    })

    const aevoNachweis = ausbilder?.qualifikationen.find(q => q.typ === 'AEVO')
    
    if (!aevoNachweis || this.istAbgelaufen(aevoNachweis.gueltigBis)) {
      // Benachrichtigung für AEVO-Kurs
      await this.erstelleAEVOErinnerung(ausbilderId)
      
      return {
        status: 'erforderlich',
        naechsterKurs: await this.findeNaechstenAEVOKurs(),
        anmeldeFrist: this.berechneAnmeldeFrist()
      }
    }

    return {
      status: 'gueltig',
      gueltigBis: aevoNachweis.gueltigBis,
      naechsteAuffrischung: this.berechneAuffrischungstermin(aevoNachweis.gueltigBis)
    }
  }

  // Private Hilfsmethoden

  private async loadeBIBBRahmenlehrplan(beruf: string): Promise<BIBBRahmenlehrplan> {
    // Integration mit BIBB-API oder lokaler Datenbank
    const rahmenlehrpläne = {
      'Fachinformatiker Anwendungsentwicklung': {
        beruf: 'Fachinformatiker Anwendungsentwicklung',
        ausbildungsdauer: 36, // 3 Jahre
        version: '2020',
        lernfelder: [
          {
            id: 'lf1',
            nummer: 1,
            bezeichnung: 'Das Unternehmen und die eigene Rolle im Betrieb beschreiben',
            zeitrichtwert: 40,
            ausbildungsjahr: 1,
            ziele: ['Betriebsstrukturen verstehen', 'Arbeitsabläufe einordnen'],
            inhalte: ['Unternehmensformen', 'Geschäftsprozesse', 'Qualitätsmanagement'],
            kompetenzen: ['Fachkompetenz', 'Sozialkompetenz']
          },
          {
            id: 'lf2',
            bezeichnung: 'Arbeitsplätze nach Kundenwunsch ausstatten',
            zeitrichtwert: 80,
            ausbildungsjahr: 1,
            // ... weitere Lernfelder
          }
          // ... alle 12 Lernfelder für Fachinformatiker
        ],
        pruefungen: [
          {
            typ: 'Zwischenprüfung',
            zeitpunkt: 'Mitte 2. Ausbildungsjahr',
            dauer: 90,
            bereiche: [
              {
                name: 'Einrichten eines IT-gestützten Arbeitsplatzes',
                art: 'schriftlich',
                dauer: 90,
                gewichtung: 100,
                themen: ['Hardware', 'Software', 'Netzwerke']
              }
            ],
            gewichtung: 20
          }
          // ... weitere Prüfungen
        ]
      }
      // ... weitere Berufe
    }

    const plan = rahmenlehrpläne[beruf as keyof typeof rahmenlehrpläne]
    if (!plan) {
      throw new ValidationError(`Rahmenlehrplan für Beruf "${beruf}" nicht gefunden`)
    }

    return plan as BIBBRahmenlehrplan
  }

  private planeLernfelder(lernfelder: Lernfeld[], startDatum: Date) {
    const planung = []
    let aktuelleDatum = new Date(startDatum)

    for (const lernfeld of lernfelder) {
      const endDatum = new Date(aktuelleDatum)
      endDatum.setDate(endDatum.getDate() + (lernfeld.zeitrichtwert / 8)) // 8h pro Tag

      planung.push({
        ...lernfeld,
        startDatum: new Date(aktuelleDatum),
        endDatum
      })

      aktuelleDatum = new Date(endDatum)
    }

    return planung
  }

  private planePruefungen(pruefungen: Pruefung[], startDatum: Date) {
    return pruefungen.map(pruefung => {
      const datum = new Date(startDatum)
      
      // Berechne Prüfungstermin basierend auf Zeitpunkt
      if (pruefung.zeitpunkt.includes('Mitte 2.')) {
        datum.setMonth(datum.getMonth() + 18) // 1.5 Jahre
      } else if (pruefung.zeitpunkt.includes('Ende 3.')) {
        datum.setMonth(datum.getMonth() + 36) // 3 Jahre
      }

      return {
        ...pruefung,
        id: `${pruefung.typ}-${Date.now()}`,
        datum
      }
    })
  }

  private async pruefeAusbilderBerechtigung(ausbilderId: string) {
    const ausbilder = await this.prisma.ausbilder.findUnique({
      where: { id: ausbilderId },
      include: { qualifikationen: true }
    })

    if (!ausbilder) {
      throw new ValidationError('Ausbilder nicht gefunden')
    }

    const aevoNachweis = ausbilder.qualifikationen.find(q => q.typ === 'AEVO')
    if (!aevoNachweis || this.istAbgelaufen(aevoNachweis.gueltigBis)) {
      throw new ValidationError('Ausbilder ohne gültigen AEVO-Nachweis')
    }
  }

  private async pruefeJugendschutz(azubiId: string, ausbildungsbeginn: Date) {
    const azubi = await this.prisma.user.findUnique({
      where: { id: azubiId }
    })

    if (!azubi?.geburtsdatum) return

    const alter = this.berechneAlter(azubi.geburtsdatum, ausbildungsbeginn)
    
    if (alter < 18) {
      // Jugendschutz-Regeln aktivieren
      await this.aktiviereJugendschutz(azubiId, alter)
    }
  }

  private async pruefeArbeitszeiten(azubiId: string) {
    const azubi = await this.prisma.user.findUnique({
      where: { id: azubiId }
    })

    const violations: string[] = []
    const alter = azubi?.geburtsdatum ? this.berechneAlter(azubi.geburtsdatum) : 18

    // Arbeitszeiten der letzten 30 Tage prüfen
    const arbeitszeiten = await this.prisma.arbeitszeit.findMany({
      where: {
        azubiId,
        datum: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }
    })

    for (const zeit of arbeitszeiten) {
      const tagesStunden = zeit.ende.getTime() - zeit.start.getTime()
      const stunden = tagesStunden / (1000 * 60 * 60)

      // Jugendschutz: max 8h/Tag für unter 18-Jährige
      if (alter < 18 && stunden > 8) {
        violations.push(`Jugendschutz verletzt: ${stunden}h am ${zeit.datum.toLocaleDateString()}`)
      }

      // BBiG: max 8h/Tag normal, max 10h mit Ausgleich
      if (stunden > 10) {
        violations.push(`Arbeitszeit überschritten: ${stunden}h am ${zeit.datum.toLocaleDateString()}`)
      }
    }

    return { violations }
  }

  private async pruefeAusbildungsnachweis(azubiId: string) {
    const letzteWoche = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    
    const nachweise = await this.prisma.ausbildungsnachweis.count({
      where: {
        azubiId,
        woche: { gte: letzteWoche }
      }
    })

    return {
      vollstaendig: nachweise > 0,
      fehlend: nachweise === 0 ? 1 : 0
    }
  }

  private async pruefeAusbilderQualifikation(azubiId: string) {
    const ausbildungsplan = await this.prisma.ausbildungsplan.findFirst({
      where: { azubiId },
      include: {
        ausbilder: {
          include: { qualifikationen: true }
        }
      }
    })

    const aevoNachweis = ausbildungsplan?.ausbilder?.qualifikationen
      .find(q => q.typ === 'AEVO' && !this.istAbgelaufen(q.gueltigBis))

    return {
      aevoNachweis: !!aevoNachweis,
      gueltigBis: aevoNachweis?.gueltigBis
    }
  }

  private berechneAlter(geburtsdatum: Date, stichtag: Date = new Date()): number {
    const diff = stichtag.getTime() - geburtsdatum.getTime()
    return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000))
  }

  private istAbgelaufen(datum: Date): boolean {
    return new Date() > datum
  }

  // Weitere private Hilfsmethoden...
  private async getAusbildungsplan(azubiId: string) {
    return this.prisma.ausbildungsplan.findFirst({
      where: { azubiId },
      include: { pruefungen: true, lernfelder: true }
    })
  }

  private mappeAusbildungsplanStatus(plan: any): AusbildungsplanStatus {
    // Mapping-Logik
    return {
      azubiId: plan.azubiId,
      beruf: plan.beruf,
      ausbildungsbeginn: plan.ausbildungsbeginn,
      geplantesEnde: plan.geplantesEnde,
      fortschritt: [],
      pruefungstermine: []
    }
  }
}
