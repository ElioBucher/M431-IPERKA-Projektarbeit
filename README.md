# KlassenHub Backend – Setup Anleitung

## Was ist drin

Diese Files sind dein komplettes Backend. Du musst sie in dein bestehendes
Quarkus-Projekt einfügen und ein paar Dinge konfigurieren.

---

## Step-by-Step

### Schritt 1 – Files einfügen

Kopiere folgende Ordner/Files in dein Projekt:

```
pom.xml                        → ersetzt deine pom.xml komplett
src/main/resources/
  application.properties       → ersetzt deine application.properties
  db/init.sql                  → neu
src/main/java/ch/bbzw/classhub/
  model/         → alle 7 Entity-Klassen
  resource/      → alle 6 Resource-Klassen
  security/      → AuthHelper.java
```

---

### Schritt 2 – JWT-Schlüssel kopieren

Nimm die Schlüssel aus dem Login-Projekt und kopiere sie:

```
quarkus-login/src/main/resources/privateKey.pem  →  src/main/resources/privateKey.pem
quarkus-login/src/main/resources/publicKey.pem   →  src/main/resources/publicKey.pem
```

---

### Schritt 3 – Datenbank erstellen

```bash
mkdir -p db
sqlite3 db/class.db < src/main/resources/db/init.sql
```

Danach liegt die Datei `db/class.db` im Projektverzeichnis.

---

### Schritt 4 – Erste Klasse anlegen (einmalig)

Da es noch kein Register-Endpoint gibt, Klasse direkt in die DB einfügen:

```bash
# BCrypt-Hash für dein Passwort erzeugen (Java-Snippet oder online tool)
# Beispiel-Hash für "test123":
sqlite3 db/class.db "INSERT INTO class (class_name, password_hash) VALUES ('AP26a', '\$2a\$10\$abc...');"
```

**Einfacher:** Füge einen temporären Register-Endpoint hinzu (oder benutze den
Login-Test weiter unten nach dem Start) und rufe ihn einmal auf:

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"className": "AP26a", "password": "test123"}'
```

> Hinweis: Wenn du keinen Register-Endpoint willst, kannst du die Klasse auch
> direkt über ein kleines Java-Snippet mit BCrypt hashen und in die DB schreiben.

---

### Schritt 5 – Starten

```bash
./mvnw quarkus:dev
```

Server läuft auf: `http://localhost:8080`

---

### Schritt 6 – Login testen

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"className": "AP26a", "password": "test123"}'
```

Erwartete Response:
```json
{
  "classId": 1,
  "className": "AP26a",
  "token": "eyJ..."
}
```

---

### Schritt 7 – Gesicherten Endpoint testen

```bash
curl http://localhost:8080/api/classes/1/modules \
  -H "Authorization: Bearer <token>"
```

---

## Alle Endpoints im Überblick

| Methode | Pfad                                  | Auth |
|---------|---------------------------------------|------|
| POST    | `/api/auth/login`                     | –    |
| POST    | `/api/auth/logout`                    | –    |
| GET     | `/api/classes/:classId/modules`       | JWT  |
| POST    | `/api/classes/:classId/modules`       | JWT  |
| DELETE  | `/api/modules/:moduleId`              | JWT  |
| GET     | `/api/modules/:moduleId/homework`     | JWT  |
| POST    | `/api/modules/:moduleId/homework`     | JWT  |
| DELETE  | `/api/homework/:id`                   | JWT  |
| GET     | `/api/modules/:moduleId/exams`        | JWT  |
| POST    | `/api/modules/:moduleId/exams`        | JWT  |
| DELETE  | `/api/exams/:id`                      | JWT  |
| GET     | `/api/modules/:moduleId/infos`        | JWT  |
| POST    | `/api/modules/:moduleId/infos`        | JWT  |
| DELETE  | `/api/infos/:id`                      | JWT  |
| GET     | `/api/modules/:moduleId/questions`    | JWT  |
| POST    | `/api/modules/:moduleId/questions`    | JWT  |
| DELETE  | `/api/questions/:id`                  | JWT  |
| POST    | `/api/questions/:questionId/answers`  | JWT  |
| DELETE  | `/api/answers/:id`                    | JWT  |
| GET     | `/api/health`                         | –    |

---

## Sicherheit

- Jedes JWT enthält die `classId` als Claim
- Jede Resource prüft via `AuthHelper` ob die `classId` im Token mit der
  angefragten Ressource übereinstimmt
- Klasse A kann nie Daten von Klasse B sehen oder verändern
- Passwörter werden mit BCrypt (cost 10) gehasht, nie im Klartext gespeichert
- SQLite-Datei liegt unter `db/class.db` – diese Datei sicher aufbewahren!

---

## Mögliche Fehler

**`sqlite-jdbc` nicht gefunden:**
```bash
./mvnw dependency:resolve
```

**`SQLiteDialect` nicht gefunden:**
Stelle sicher dass `hibernate-community-dialects` in der pom.xml ist.
(ist bereits drin als transitive Dependency von hibernate-orm-panache)

**Port 8080 belegt:**
```properties
# application.properties
quarkus.http.port=8081
```
