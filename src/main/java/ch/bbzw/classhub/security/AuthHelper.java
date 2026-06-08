package ch.bbzw.classhub.security;

import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.jwt.JsonWebToken;

/**
 * Hilfsdienst: Liest die classId aus dem JWT-Token.
 * Wird in allen Resources verwendet um sicherzustellen,
 * dass man nur auf eigene Klassen-Daten zugreift.
 */
@RequestScoped
public class AuthHelper {

    @Inject
    JsonWebToken jwt;

    /**
     * Gibt die classId aus dem JWT zurück.
     */
    public Long getClassId() {
        Object claim = jwt.getClaim("classId");
        if (claim == null) return null;
        return Long.parseLong(claim.toString());
    }

    /**
     * Prüft ob der eingeloggte User zu dieser classId gehört.
     */
    public boolean ownsClass(Long classId) {
        Long myId = getClassId();
        return myId != null && myId.equals(classId);
    }

    /**
     * Prüft ob ein Modul zur eingeloggten Klasse gehört.
     */
    public boolean ownsModule(ch.bbzw.classhub.model.Module module) {
        if (module == null) return false;
        return ownsClass(module.classId);
    }
}
