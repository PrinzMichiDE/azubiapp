# 📡 Azubi App - API-Dokumentation

## 🌐 **API-Übersicht**

Die Azubi App bietet eine vollständige REST-API mit 25+ Endpoints für alle Funktionalitäten. Alle API-Aufrufe verwenden JSON und unterstützen Standard HTTP-Methoden.

### **🔗 Base URL**
```
Development: http://localhost:8080/api
Production:  https://your-domain.com/api
```

### **🔐 Authentifizierung**
```http
Authorization: Bearer <jwt_token>
```

---

## 🔐 **Authentication Endpoints**

### **POST /api/auth/register**
Neuen Benutzer registrieren

**Request Body:**
```json
{
  "email": "user@example.com",
  "username": "username",
  "password": "password123",
  "firstName": "Max",
  "lastName": "Mustermann"
}
```

**Response (201):**
```json
{
  "message": "Benutzer erfolgreich registriert",
  "user": {
    "id": "clk1234567890",
    "email": "user@example.com",
    "username": "username",
    "firstName": "Max",
    "lastName": "Mustermann",
    "role": "USER",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### **POST /api/auth/login**
Benutzer anmelden

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "message": "Erfolgreich angemeldet",
  "user": {
    "id": "clk1234567890",
    "email": "user@example.com",
    "username": "username",
    "firstName": "Max",
    "lastName": "Mustermann",
    "role": "USER",
    "isActive": true
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### **POST /api/auth/logout**
Benutzer abmelden (erfordert Authentication)

**Response (200):**
```json
{
  "message": "Erfolgreich abgemeldet"
}
```

---

## 👤 **User Endpoints**

### **GET /api/users/profile**
Benutzerprofil mit Statistiken abrufen

**Response (200):**
```json
{
  "profile": {
    "id": "clk1234567890",
    "email": "user@example.com",
    "username": "username",
    "firstName": "Max",
    "lastName": "Mustermann",
    "avatar": null,
    "role": "USER",
    "isActive": true,
    "emailVerified": null,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "stats": {
      "projects": {
        "total": 5,
        "active": 3,
        "completed": 2,
        "onHold": 0
      },
      "tasks": {
        "total": 25,
        "completed": 18,
        "active": 7,
        "cancelled": 0
      },
      "timeTracking": {
        "totalHours": 125.5,
        "totalEntries": 89,
        "averagePerEntry": 1.4
      }
    },
    "recentActivity": [...],
    "achievements": [...],
    "memberSince": "2024-01-15T10:30:00.000Z",
    "lastActive": "2024-01-20T15:45:00.000Z"
  }
}
```

### **PUT /api/users/profile**
Profil aktualisieren oder Passwort ändern

**Request Body (Profil-Update):**
```json
{
  "action": "update-profile",
  "firstName": "Max",
  "lastName": "Mustermann",
  "email": "newemail@example.com",
  "username": "newusername",
  "avatar": "https://example.com/avatar.jpg"
}
```

**Request Body (Passwort ändern):**
```json
{
  "action": "change-password",
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword123",
  "confirmPassword": "newpassword123"
}
```

**Response (200):**
```json
{
  "message": "Profil erfolgreich aktualisiert",
  "user": {
    "id": "clk1234567890",
    "email": "newemail@example.com",
    "username": "newusername",
    "firstName": "Max",
    "lastName": "Mustermann",
    "avatar": "https://example.com/avatar.jpg",
    "role": "USER",
    "updatedAt": "2024-01-20T15:45:00.000Z"
  }
}
```

### **DELETE /api/users/profile**
Benutzerkonto deaktivieren

**Response (200):**
```json
{
  "message": "Konto erfolgreich deaktiviert"
}
```

---

## 📁 **Project Endpoints**

### **GET /api/projects**
Alle Projekte abrufen mit optionalen Filtern

**Query Parameters:**
- `status` - Projektstatus (ACTIVE, COMPLETED, ON_HOLD, CANCELLED)
- `priority` - Priorität (LOW, MEDIUM, HIGH, URGENT)
- `page` - Seitennummer (default: 1)
- `limit` - Anzahl pro Seite (default: 20)

**Example:** `GET /api/projects?status=ACTIVE&priority=HIGH&page=1&limit=10`

**Response (200):**
```json
{
  "projects": [
    {
      "id": "clk_project_123",
      "name": "Website Redesign",
      "description": "Komplette Neugestaltung der Unternehmenswebsite",
      "status": "ACTIVE",
      "priority": "HIGH",
      "startDate": "2024-01-15T00:00:00.000Z",
      "endDate": "2024-03-15T00:00:00.000Z",
      "budget": 25000.00,
      "clientName": "Beispiel GmbH",
      "createdAt": "2024-01-10T10:00:00.000Z",
      "updatedAt": "2024-01-20T15:30:00.000Z",
      "_count": {
        "tasks": 15,
        "members": 4,
        "timeEntries": 45
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

### **POST /api/projects**
Neues Projekt erstellen

**Request Body:**
```json
{
  "name": "Neues Projekt",
  "description": "Projektbeschreibung",
  "status": "ACTIVE",
  "priority": "MEDIUM",
  "startDate": "2024-02-01T00:00:00.000Z",
  "endDate": "2024-04-01T00:00:00.000Z",
  "budget": 15000.00,
  "clientName": "Kunde ABC"
}
```

**Response (201):**
```json
{
  "message": "Projekt erfolgreich erstellt",
  "project": {
    "id": "clk_project_new",
    "name": "Neues Projekt",
    "description": "Projektbeschreibung",
    "status": "ACTIVE",
    "priority": "MEDIUM",
    "startDate": "2024-02-01T00:00:00.000Z",
    "endDate": "2024-04-01T00:00:00.000Z",
    "budget": 15000.00,
    "clientName": "Kunde ABC",
    "createdAt": "2024-01-20T16:00:00.000Z",
    "updatedAt": "2024-01-20T16:00:00.000Z",
    "_count": {
      "tasks": 0,
      "members": 1,
      "timeEntries": 0
    }
  }
}
```

### **GET /api/projects/[id]**
Einzelprojekt mit Details abrufen

**Response (200):**
```json
{
  "project": {
    "id": "clk_project_123",
    "name": "Website Redesign",
    "description": "Komplette Neugestaltung der Unternehmenswebsite",
    "status": "ACTIVE",
    "priority": "HIGH",
    "startDate": "2024-01-15T00:00:00.000Z",
    "endDate": "2024-03-15T00:00:00.000Z",
    "budget": 25000.00,
    "clientName": "Beispiel GmbH",
    "members": [
      {
        "id": "clk_member_1",
        "role": "OWNER",
        "joinedAt": "2024-01-10T10:00:00.000Z",
        "user": {
          "id": "clk_user_1",
          "username": "project_manager",
          "firstName": "Anna",
          "lastName": "Schmidt",
          "email": "anna@example.com",
          "role": "MANAGER"
        }
      }
    ],
    "tasks": [
      {
        "id": "clk_task_1",
        "title": "Homepage Design",
        "status": "IN_PROGRESS",
        "priority": "HIGH",
        "creator": {
          "id": "clk_user_1",
          "username": "project_manager",
          "firstName": "Anna",
          "lastName": "Schmidt"
        },
        "assignedUser": {
          "id": "clk_user_2",
          "username": "designer",
          "firstName": "Tom",
          "lastName": "Weber"
        },
        "_count": {
          "subtasks": 3,
          "timeEntries": 8,
          "comments": 5
        }
      }
    ],
    "timeEntries": [...],
    "_count": {
      "tasks": 15,
      "timeEntries": 45,
      "members": 4
    },
    "stats": {
      "progress": 75,
      "completedTasks": 11,
      "totalTasks": 15,
      "totalTimeSpent": 12600,
      "activeTasks": 4
    }
  }
}
```

### **PUT /api/projects/[id]**
Projekt aktualisieren

**Request Body:**
```json
{
  "name": "Website Redesign - Updated",
  "description": "Aktualisierte Beschreibung",
  "status": "ACTIVE",
  "priority": "URGENT",
  "endDate": "2024-04-15T00:00:00.000Z",
  "budget": 30000.00
}
```

**Response (200):**
```json
{
  "message": "Projekt erfolgreich aktualisiert",
  "project": {
    "id": "clk_project_123",
    "name": "Website Redesign - Updated",
    "description": "Aktualisierte Beschreibung",
    "status": "ACTIVE",
    "priority": "URGENT",
    "endDate": "2024-04-15T00:00:00.000Z",
    "budget": 30000.00,
    "updatedAt": "2024-01-20T16:30:00.000Z"
  }
}
```

### **DELETE /api/projects/[id]**
Projekt löschen (nur für Owner oder Admin)

**Response (200):**
```json
{
  "message": "Projekt erfolgreich gelöscht"
}
```

---

## 👥 **Project Members Endpoints**

### **GET /api/projects/[id]/members**
Projektmitglieder abrufen

**Response (200):**
```json
{
  "members": [
    {
      "id": "clk_member_1",
      "role": "OWNER",
      "joinedAt": "2024-01-10T10:00:00.000Z",
      "user": {
        "id": "clk_user_1",
        "username": "project_manager",
        "firstName": "Anna",
        "lastName": "Schmidt",
        "email": "anna@example.com",
        "role": "MANAGER",
        "isActive": true
      },
      "stats": {
        "tasks": {
          "total": 8,
          "completed": 6,
          "active": 2,
          "cancelled": 0
        },
        "timeTracking": {
          "totalTime": 7200,
          "entries": 25,
          "averagePerDay": 2.4
        }
      }
    }
  ],
  "totalMembers": 4
}
```

### **POST /api/projects/[id]/members**
Mitglied hinzufügen

**Request Body:**
```json
{
  "userId": "clk_user_456",
  "role": "MEMBER"
}
```

**Response (201):**
```json
{
  "message": "Mitglied erfolgreich hinzugefügt",
  "member": {
    "id": "clk_member_new",
    "role": "MEMBER",
    "joinedAt": "2024-01-20T16:45:00.000Z",
    "user": {
      "id": "clk_user_456",
      "username": "developer",
      "firstName": "Lisa",
      "lastName": "Müller",
      "email": "lisa@example.com",
      "role": "USER"
    },
    "project": {
      "id": "clk_project_123",
      "name": "Website Redesign"
    }
  }
}
```

### **PUT /api/projects/[id]/members**
Mitgliederrolle aktualisieren

**Request Body:**
```json
{
  "userId": "clk_user_456",
  "role": "MANAGER"
}
```

**Response (200):**
```json
{
  "message": "Mitgliederrolle erfolgreich aktualisiert",
  "member": {
    "id": "clk_member_new",
    "role": "MANAGER",
    "user": {
      "id": "clk_user_456",
      "username": "developer",
      "firstName": "Lisa",
      "lastName": "Müller",
      "email": "lisa@example.com"
    }
  }
}
```

### **DELETE /api/projects/[id]/members?userId=clk_user_456**
Mitglied entfernen

**Response (200):**
```json
{
  "message": "Mitglied erfolgreich entfernt"
}
```

---

## ✅ **Task Endpoints**

### **GET /api/tasks**
Alle Aufgaben abrufen mit Filtern

**Query Parameters:**
- `status` - Status (TODO, IN_PROGRESS, REVIEW, DONE, CANCELLED)
- `priority` - Priorität (LOW, MEDIUM, HIGH, URGENT)
- `projectId` - Projekt-ID
- `assignedTo` - Benutzer-ID des Zugewiesenen
- `page` - Seitennummer
- `limit` - Anzahl pro Seite

**Response (200):**
```json
{
  "tasks": [
    {
      "id": "clk_task_1",
      "title": "Homepage Design",
      "description": "Erstellung des Homepage-Designs",
      "status": "IN_PROGRESS",
      "priority": "HIGH",
      "estimatedHours": 16.0,
      "actualHours": 12.5,
      "dueDate": "2024-02-01T00:00:00.000Z",
      "projectId": "clk_project_123",
      "assignedTo": "clk_user_2",
      "createdBy": "clk_user_1",
      "parentTaskId": null,
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-20T14:30:00.000Z",
      "project": {
        "id": "clk_project_123",
        "name": "Website Redesign"
      },
      "creator": {
        "id": "clk_user_1",
        "username": "project_manager",
        "firstName": "Anna",
        "lastName": "Schmidt"
      },
      "assignedUser": {
        "id": "clk_user_2",
        "username": "designer",
        "firstName": "Tom",
        "lastName": "Weber"
      },
      "_count": {
        "subtasks": 3,
        "timeEntries": 8,
        "comments": 5
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

### **POST /api/tasks**
Neue Aufgabe erstellen

**Request Body:**
```json
{
  "title": "Neue Aufgabe",
  "description": "Beschreibung der Aufgabe",
  "status": "TODO",
  "priority": "MEDIUM",
  "estimatedHours": 8.0,
  "dueDate": "2024-02-15T00:00:00.000Z",
  "assignedTo": "clk_user_2",
  "projectId": "clk_project_123",
  "parentTaskId": null
}
```

**Response (201):**
```json
{
  "message": "Aufgabe erfolgreich erstellt",
  "task": {
    "id": "clk_task_new",
    "title": "Neue Aufgabe",
    "description": "Beschreibung der Aufgabe",
    "status": "TODO",
    "priority": "MEDIUM",
    "estimatedHours": 8.0,
    "actualHours": 0,
    "dueDate": "2024-02-15T00:00:00.000Z",
    "projectId": "clk_project_123",
    "assignedTo": "clk_user_2",
    "createdBy": "clk_user_1",
    "parentTaskId": null,
    "createdAt": "2024-01-20T17:00:00.000Z",
    "updatedAt": "2024-01-20T17:00:00.000Z"
  }
}
```

### **GET /api/tasks/[id]**
Einzelaufgabe mit Details abrufen

**Response (200):**
```json
{
  "task": {
    "id": "clk_task_1",
    "title": "Homepage Design",
    "description": "Erstellung des Homepage-Designs mit modernem Layout",
    "status": "IN_PROGRESS",
    "priority": "HIGH",
    "estimatedHours": 16.0,
    "actualHours": 12.5,
    "dueDate": "2024-02-01T00:00:00.000Z",
    "project": {
      "id": "clk_project_123",
      "name": "Website Redesign",
      "status": "ACTIVE",
      "priority": "HIGH"
    },
    "creator": {
      "id": "clk_user_1",
      "username": "project_manager",
      "firstName": "Anna",
      "lastName": "Schmidt",
      "email": "anna@example.com"
    },
    "assignedUser": {
      "id": "clk_user_2",
      "username": "designer",
      "firstName": "Tom",
      "lastName": "Weber",
      "email": "tom@example.com"
    },
    "parentTask": null,
    "subtasks": [
      {
        "id": "clk_task_sub_1",
        "title": "Header Design",
        "status": "DONE",
        "assignedUser": {
          "id": "clk_user_2",
          "username": "designer",
          "firstName": "Tom",
          "lastName": "Weber"
        }
      }
    ],
    "timeEntries": [
      {
        "id": "clk_time_1",
        "startTime": "2024-01-20T09:00:00.000Z",
        "endTime": "2024-01-20T12:30:00.000Z",
        "duration": 12600,
        "description": "Homepage Layout erstellt",
        "user": {
          "id": "clk_user_2",
          "username": "designer",
          "firstName": "Tom",
          "lastName": "Weber"
        }
      }
    ],
    "comments": [
      {
        "id": "clk_comment_1",
        "content": "Sehr guter Fortschritt!",
        "createdAt": "2024-01-20T15:30:00.000Z",
        "user": {
          "id": "clk_user_1",
          "username": "project_manager",
          "firstName": "Anna",
          "lastName": "Schmidt"
        }
      }
    ],
    "_count": {
      "subtasks": 3,
      "timeEntries": 8,
      "comments": 5
    },
    "stats": {
      "totalTimeSpent": 45000,
      "completedSubtasks": 2,
      "totalSubtasks": 3,
      "subtaskProgress": 67,
      "isOverdue": false,
      "timeSpentVsEstimated": 78
    }
  }
}
```

### **PUT /api/tasks/[id]**
Aufgabe aktualisieren

**Request Body:**
```json
{
  "title": "Homepage Design - Updated",
  "description": "Aktualisierte Beschreibung",
  "status": "REVIEW",
  "priority": "URGENT",
  "actualHours": 15.0,
  "dueDate": "2024-02-05T00:00:00.000Z",
  "assignedTo": "clk_user_3"
}
```

**Response (200):**
```json
{
  "message": "Aufgabe erfolgreich aktualisiert",
  "task": {
    "id": "clk_task_1",
    "title": "Homepage Design - Updated",
    "description": "Aktualisierte Beschreibung",
    "status": "REVIEW",
    "priority": "URGENT",
    "actualHours": 15.0,
    "dueDate": "2024-02-05T00:00:00.000Z",
    "assignedTo": "clk_user_3",
    "updatedAt": "2024-01-20T17:30:00.000Z"
  }
}
```

### **DELETE /api/tasks/[id]**
Aufgabe löschen

**Response (200):**
```json
{
  "message": "Aufgabe erfolgreich gelöscht"
}
```

---

## ⏱️ **Time Tracking Endpoints**

### **GET /api/time-entries**
Zeiterfassungen abrufen

**Query Parameters:**
- `userId` - Benutzer-ID
- `projectId` - Projekt-ID
- `taskId` - Aufgaben-ID
- `startDate` - Startdatum (ISO String)
- `endDate` - Enddatum (ISO String)
- `page` - Seitennummer
- `limit` - Anzahl pro Seite

**Response (200):**
```json
{
  "timeEntries": [
    {
      "id": "clk_time_1",
      "userId": "clk_user_2",
      "projectId": "clk_project_123",
      "taskId": "clk_task_1",
      "description": "Homepage Layout erstellt",
      "startTime": "2024-01-20T09:00:00.000Z",
      "endTime": "2024-01-20T12:30:00.000Z",
      "duration": 12600,
      "isBillable": true,
      "createdAt": "2024-01-20T09:00:00.000Z",
      "updatedAt": "2024-01-20T12:30:00.000Z",
      "user": {
        "id": "clk_user_2",
        "username": "designer",
        "firstName": "Tom",
        "lastName": "Weber"
      },
      "project": {
        "id": "clk_project_123",
        "name": "Website Redesign"
      },
      "task": {
        "id": "clk_task_1",
        "title": "Homepage Design"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "pages": 8
  }
}
```

### **POST /api/time-entries**
Manuelle Zeiterfassung erstellen

**Request Body:**
```json
{
  "projectId": "clk_project_123",
  "taskId": "clk_task_1",
  "description": "Bugfixes und Optimierungen",
  "startTime": "2024-01-20T14:00:00.000Z",
  "endTime": "2024-01-20T16:30:00.000Z",
  "duration": 9000,
  "isBillable": true
}
```

**Response (201):**
```json
{
  "message": "Zeiterfassung erfolgreich erstellt",
  "timeEntry": {
    "id": "clk_time_new",
    "userId": "clk_user_current",
    "projectId": "clk_project_123",
    "taskId": "clk_task_1",
    "description": "Bugfixes und Optimierungen",
    "startTime": "2024-01-20T14:00:00.000Z",
    "endTime": "2024-01-20T16:30:00.000Z",
    "duration": 9000,
    "isBillable": true,
    "createdAt": "2024-01-20T18:00:00.000Z",
    "updatedAt": "2024-01-20T18:00:00.000Z"
  }
}
```

---

## ⏲️ **Timer Management Endpoints**

### **GET /api/time-entries/timer**
Aktuellen Timer-Status abrufen

**Response (200) - Timer läuft:**
```json
{
  "isRunning": true,
  "timeEntry": {
    "id": "clk_time_active",
    "startTime": "2024-01-20T15:30:00.000Z",
    "currentDuration": 1800,
    "project": {
      "id": "clk_project_123",
      "name": "Website Redesign"
    },
    "task": {
      "id": "clk_task_1",
      "title": "Homepage Design"
    }
  }
}
```

**Response (200) - Kein Timer:**
```json
{
  "isRunning": false,
  "timeEntry": null
}
```

### **POST /api/time-entries/timer**
Timer-Operationen (Start/Stop/Pause)

**Timer starten:**
```json
{
  "action": "start",
  "projectId": "clk_project_123",
  "taskId": "clk_task_1",
  "description": "Beginn der Arbeit an Homepage"
}
```

**Response (200):**
```json
{
  "message": "Timer erfolgreich gestartet",
  "timeEntry": {
    "id": "clk_time_active",
    "userId": "clk_user_current",
    "projectId": "clk_project_123",
    "taskId": "clk_task_1",
    "description": "Beginn der Arbeit an Homepage",
    "startTime": "2024-01-20T18:30:00.000Z",
    "endTime": null,
    "isBillable": false,
    "project": {
      "id": "clk_project_123",
      "name": "Website Redesign"
    },
    "task": {
      "id": "clk_task_1",
      "title": "Homepage Design"
    }
  }
}
```

**Timer stoppen:**
```json
{
  "action": "stop",
  "description": "Aufgabe abgeschlossen",
  "isBillable": true
}
```

**Response (200):**
```json
{
  "message": "Timer erfolgreich gestoppt",
  "timeEntry": {
    "id": "clk_time_active",
    "startTime": "2024-01-20T18:30:00.000Z",
    "endTime": "2024-01-20T20:15:00.000Z",
    "duration": 6300,
    "description": "Aufgabe abgeschlossen",
    "isBillable": true,
    "project": {
      "id": "clk_project_123",
      "name": "Website Redesign"
    },
    "task": {
      "id": "clk_task_1",
      "title": "Homepage Design"
    }
  }
}
```

**Timer pausieren:**
```json
{
  "action": "pause"
}
```

**Response (200):**
```json
{
  "message": "Timer erfolgreich pausiert",
  "timeEntry": {
    "id": "clk_time_active",
    "startTime": "2024-01-20T18:30:00.000Z",
    "endTime": "2024-01-20T19:45:00.000Z",
    "duration": 4500,
    "project": {
      "id": "clk_project_123",
      "name": "Website Redesign"
    },
    "task": {
      "id": "clk_task_1",
      "title": "Homepage Design"
    }
  }
}
```

---

## 📊 **Dashboard Endpoints**

### **GET /api/dashboard/stats**
Dashboard-Statistiken abrufen

**Response (200):**
```json
{
  "projects": {
    "total": 12,
    "active": 8,
    "completed": 4,
    "onHold": 0,
    "progress": 33
  },
  "tasks": {
    "total": 45,
    "completed": 28,
    "active": 17,
    "overdue": 3,
    "progress": 62
  },
  "timeTracking": {
    "today": {
      "duration": 7200,
      "entries": 3
    },
    "week": {
      "duration": 28800,
      "entries": 12
    },
    "month": {
      "duration": 144000,
      "entries": 45
    }
  },
  "users": {
    "total": 25,
    "active": 23
  },
  "productivity": {
    "averageTasksPerProject": 3.75,
    "averageTimePerTask": 2.4,
    "completionRate": 62
  },
  "timer": {
    "isRunning": true,
    "project": "Website Redesign",
    "task": "Homepage Design",
    "startTime": "2024-01-20T18:30:00.000Z",
    "currentDuration": 1800
  },
  "recentProjects": [
    {
      "id": "clk_project_123",
      "name": "Website Redesign",
      "status": "ACTIVE",
      "priority": "HIGH",
      "progress": 75,
      "endDate": "2024-03-15T00:00:00.000Z",
      "_count": {
        "tasks": 15,
        "members": 4,
        "timeEntries": 45
      }
    }
  ],
  "recentTasks": [
    {
      "id": "clk_task_1",
      "title": "Homepage Design",
      "status": "IN_PROGRESS",
      "priority": "HIGH",
      "dueDate": "2024-02-01T00:00:00.000Z",
      "isOverdue": false,
      "project": {
        "id": "clk_project_123",
        "name": "Website Redesign"
      },
      "assignedUser": {
        "id": "clk_user_2",
        "firstName": "Tom",
        "lastName": "Weber"
      }
    }
  ],
  "generatedAt": "2024-01-20T20:30:00.000Z",
  "userRole": "USER"
}
```

---

## 🔔 **Notification Endpoints**

### **GET /api/notifications**
Benachrichtigungen abrufen

**Query Parameters:**
- `type` - Typ (INFO, SUCCESS, WARNING, ERROR)
- `isRead` - Gelesen-Status (true/false)
- `page` - Seitennummer
- `limit` - Anzahl pro Seite

**Response (200):**
```json
{
  "notifications": [
    {
      "id": "clk_notif_1",
      "userId": "clk_user_current",
      "title": "Neue Aufgabe zugewiesen",
      "message": "Ihnen wurde die Aufgabe \"Homepage Design\" zugewiesen.",
      "type": "INFO",
      "isRead": false,
      "createdAt": "2024-01-20T18:00:00.000Z"
    },
    {
      "id": "clk_notif_2",
      "userId": "clk_user_current",
      "title": "Projekt abgeschlossen",
      "message": "Das Projekt \"Mobile App\" wurde erfolgreich abgeschlossen.",
      "type": "SUCCESS",
      "isRead": true,
      "createdAt": "2024-01-19T16:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 35,
    "pages": 2
  },
  "unreadCount": 7
}
```

### **POST /api/notifications** 
Neue Benachrichtigung erstellen (nur für Admins)

**Request Body:**
```json
{
  "userId": "clk_user_target",
  "title": "Wichtige Mitteilung",
  "message": "Bitte beachten Sie die neuen Projektrichtlinien.",
  "type": "WARNING"
}
```

**Response (201):**
```json
{
  "message": "Benachrichtigung erfolgreich erstellt",
  "notification": {
    "id": "clk_notif_new",
    "userId": "clk_user_target",
    "title": "Wichtige Mitteilung",
    "message": "Bitte beachten Sie die neuen Projektrichtlinien.",
    "type": "WARNING",
    "isRead": false,
    "createdAt": "2024-01-20T20:45:00.000Z"
  }
}
```

### **PUT /api/notifications**
Benachrichtigungen als gelesen markieren

**Spezifische Benachrichtigungen:**
```json
{
  "action": "mark-read",
  "notificationIds": ["clk_notif_1", "clk_notif_2", "clk_notif_3"]
}
```

**Alle Benachrichtigungen:**
```json
{
  "action": "mark-all-read"
}
```

**Response (200):**
```json
{
  "message": "3 Benachrichtigungen als gelesen markiert"
}
```

### **DELETE /api/notifications**
Benachrichtigungen löschen

**Spezifische Benachrichtigungen:**
`DELETE /api/notifications?ids=clk_notif_1,clk_notif_2`

**Alle gelesenen Benachrichtigungen:**
`DELETE /api/notifications?all=true`

**Response (200):**
```json
{
  "message": "2 Benachrichtigungen gelöscht"
}
```

---

## 📁 **File Upload Endpoints**

### **GET /api/upload**
Dateien abrufen

**Query Parameters:**
- `projectId` - Projekt-ID
- `taskId` - Aufgaben-ID
- `fileType` - Dateityp (images, documents, archives)
- `page` - Seitennummer
- `limit` - Anzahl pro Seite

**Response (200):**
```json
{
  "files": [
    {
      "id": "clk_file_1",
      "fileName": "design_mockup.png",
      "filePath": "/uploads/clk_user_2/1642694400_abc123.png",
      "fileSize": 2048576,
      "fileType": "image/png",
      "uploadedBy": "clk_user_2",
      "projectId": "clk_project_123",
      "taskId": "clk_task_1",
      "description": "Homepage Design Mockup",
      "createdAt": "2024-01-20T15:00:00.000Z",
      "updatedAt": "2024-01-20T15:00:00.000Z",
      "uploadedByUser": {
        "id": "clk_user_2",
        "username": "designer",
        "firstName": "Tom",
        "lastName": "Weber"
      },
      "project": {
        "id": "clk_project_123",
        "name": "Website Redesign"
      },
      "task": {
        "id": "clk_task_1",
        "title": "Homepage Design"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 15,
    "pages": 1
  }
}
```

### **POST /api/upload**
Datei hochladen

**Request (multipart/form-data):**
```
file: [File Object]
projectId: "clk_project_123" (optional)
taskId: "clk_task_1" (optional)
description: "Design Mockup für Homepage" (optional)
```

**Response (201):**
```json
{
  "message": "Datei erfolgreich hochgeladen",
  "file": {
    "id": "clk_file_new",
    "fileName": "design_mockup.png",
    "filePath": "/uploads/clk_user_2/1642694400_abc123.png",
    "fileSize": 2048576,
    "fileType": "image/png",
    "uploadedBy": "clk_user_2",
    "projectId": "clk_project_123",
    "taskId": "clk_task_1",
    "description": "Design Mockup für Homepage",
    "createdAt": "2024-01-20T21:00:00.000Z",
    "updatedAt": "2024-01-20T21:00:00.000Z",
    "uploadedByUser": {
      "id": "clk_user_2",
      "username": "designer",
      "firstName": "Tom",
      "lastName": "Weber"
    },
    "project": {
      "id": "clk_project_123",
      "name": "Website Redesign"
    },
    "task": {
      "id": "clk_task_1",
      "title": "Homepage Design"
    }
  }
}
```

### **DELETE /api/upload?id=clk_file_1**
Datei löschen

**Response (200):**
```json
{
  "message": "Datei erfolgreich gelöscht"
}
```

---

## ⚠️ **Error Responses**

### **Standard Error Format:**
```json
{
  "error": "Fehlermeldung",
  "details": [...],  // Optional: Validierungsdetails
  "retryAfter": 900  // Optional: Für Rate-Limiting
}
```

### **HTTP-Status-Codes:**
- `200` - OK
- `201` - Created
- `400` - Bad Request (Validierungsfehler)
- `401` - Unauthorized (Nicht angemeldet)
- `403` - Forbidden (Keine Berechtigung)
- `404` - Not Found (Ressource nicht gefunden)
- `429` - Too Many Requests (Rate-Limit erreicht)
- `500` - Internal Server Error

### **Beispiel-Errors:**

**Validierungsfehler (400):**
```json
{
  "error": "Validierungsfehler",
  "details": [
    {
      "code": "too_small",
      "minimum": 8,
      "type": "string",
      "inclusive": true,
      "exact": false,
      "message": "String must contain at least 8 character(s)",
      "path": ["password"]
    }
  ]
}
```

**Unauthorized (401):**
```json
{
  "error": "Nicht autorisiert. Bitte melden Sie sich an."
}
```

**Rate Limit (429):**
```json
{
  "error": "Zu viele Anfragen. Versuchen Sie es später erneut.",
  "retryAfter": 900
}
```

---

## 🚀 **API-Client-Beispiel**

### **JavaScript/TypeScript Beispiel:**

```typescript
// API-Client-Konfiguration
const API_BASE_URL = 'http://localhost:8080/api'

class AzubiAPI {
  private token: string | null = null

  constructor() {
    this.token = localStorage.getItem('auth_token')
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...options.headers,
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (response.status === 401) {
      localStorage.removeItem('auth_token')
      window.location.href = '/auth/login'
      return
    }

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'API Error')
    }

    return response.json()
  }

  // Authentication
  async login(email: string, password: string) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    })
    
    this.token = response.token
    localStorage.setItem('auth_token', response.token)
    return response
  }

  // Projects
  async getProjects(filters = {}) {
    const params = new URLSearchParams(filters)
    return this.request(`/projects?${params}`)
  }

  async createProject(projectData: any) {
    return this.request('/projects', {
      method: 'POST',
      body: JSON.stringify(projectData)
    })
  }

  // Timer
  async startTimer(projectId: string, taskId?: string) {
    return this.request('/time-entries/timer', {
      method: 'POST',
      body: JSON.stringify({
        action: 'start',
        projectId,
        taskId
      })
    })
  }

  async stopTimer(isBillable = true) {
    return this.request('/time-entries/timer', {
      method: 'POST',
      body: JSON.stringify({
        action: 'stop',
        isBillable
      })
    })
  }
}

// Verwendung
const api = new AzubiAPI()

// Login
await api.login('user@example.com', 'password123')

// Projekte abrufen
const projects = await api.getProjects({ status: 'ACTIVE' })

// Timer starten
await api.startTimer('clk_project_123', 'clk_task_1')
```

---

## 📝 **Rate Limiting**

### **Rate-Limit-Konfiguration:**

| Endpoint-Gruppe | Limit | Zeitfenster | Beschreibung |
|------------------|-------|-------------|--------------|
| Global | 1000 requests | 15 min | Pro IP-Adresse |
| Auth | 10 attempts | 15 min | Login-Versuche pro IP |
| API | 500 requests | 15 min | Pro authentifiziertem Benutzer |
| Upload | 50 uploads | 1 hour | Pro Benutzer |

### **Rate-Limit-Headers:**
```http
X-RateLimit-Limit: 500
X-RateLimit-Remaining: 485
X-RateLimit-Reset: 2024-01-20T21:00:00.000Z
```

---

Diese API-Dokumentation bietet eine vollständige Referenz für alle verfügbaren Endpoints der Azubi App. Alle Beispiele verwenden echte Datenstrukturen und zeigen typische Request/Response-Muster.
