package ch.bbzw.classhub.resource;

import at.favre.lib.crypto.bcrypt.BCrypt;
import ch.bbzw.classhub.model.Class;
import io.smallrye.jwt.build.Jwt;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.time.Instant;
import java.util.Map;
import java.util.Set;

@Path("/api/auth")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class AuthResource {

    @ConfigProperty(name = "mp.jwt.verify.issuer")
    String issuer;

    @ConfigProperty(name = "app.jwt.expiry-seconds", defaultValue = "3600")
    long expirySeconds;

    public record LoginRequest(String username, String password) {}
    public record RegisterRequest(String className, String password) {}

    /**
     * POST /api/auth/login
     * Response: { classId, className, token }
     */
    @POST
    @Path("/login")
    @Transactional
    public Response login(LoginRequest req) {
        if (req.username() == null || req.password() == null) {
            return Response.status(400)
                    .entity(Map.of("error", "username und password erforderlich"))
                    .build();
        }

        Class klasse = Class.findByClassName(req.username());

        if (klasse == null) {
            return Response.status(401)
                    .entity(Map.of("error", "Ungültige Anmeldedaten"))
                    .build();
        }

        BCrypt.Result result = BCrypt.verifyer().verify(
                req.password().toCharArray(), klasse.passwordHash);

        if (!result.verified) {
            return Response.status(401)
                    .entity(Map.of("error", "Ungültige Anmeldedaten"))
                    .build();
        }

        String token = Jwt.issuer(issuer)
                .subject(klasse.className)
                .groups(Set.of("user"))
                .claim("classId", klasse.id)
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(expirySeconds))
                .sign();

        // Exakt das was das Frontend braucht: { classId, className, token }
        return Response.ok(Map.of(
                "classId",   klasse.id,
                "className", klasse.className,
                "token",     token
        )).build();
    }

    /**
     * POST /api/auth/register
     * Body: { className, password }
     * Response: { classId, className, token }
     */
    @POST
    @Path("/register")
    @Transactional
    public Response register(RegisterRequest req) {
        if (req.className() == null || req.password() == null) {
            return Response.status(400)
                    .entity(Map.of("error", "className und password erforderlich"))
                    .build();
        }

        // Prüfen ob Klasse bereits existiert
        if (Class.findByClassName(req.className()) != null) {
            return Response.status(409).entity(Map.of("error", "Klasse existiert bereits")).build();
        }

        // Passwort hashen
        String hash = BCrypt.withDefaults().hashToString(12, req.password().toCharArray());

        Class k = new Class();
        k.className = req.className();
        k.passwordHash = hash;
        k.persist();

        String token = Jwt.issuer(issuer)
                .subject(k.className)
                .groups(Set.of("user"))
                .claim("classId", k.id)
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(expirySeconds))
                .sign();

        return Response.status(201).entity(Map.of(
                "classId",   k.id,
                "className", k.className,
                "token",     token
        )).build();
    }

    /**
     * POST /api/auth/logout
     * JWT ist stateless – Frontend löscht den Token aus sessionStorage.
     */
    @POST
    @Path("/logout")
    public Response logout() {
        return Response.noContent().build();
    }
}
