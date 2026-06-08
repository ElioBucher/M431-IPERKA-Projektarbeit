package ch.bbzw.classhub.resource;

import ch.bbzw.classhub.model.Answer;
import ch.bbzw.classhub.model.Exam;
import ch.bbzw.classhub.model.Homework;
import ch.bbzw.classhub.model.Info;
import ch.bbzw.classhub.model.Module;
import ch.bbzw.classhub.model.Question;
import ch.bbzw.classhub.security.AuthHelper;
import io.quarkus.security.Authenticated;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.Map;

@Path("/api")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Authenticated
public class ModuleResource {

    @Inject
    AuthHelper auth;

    public record ModuleRequest(String name) {}

    /**
     * GET /api/classes/:classId/modules
     * Response: [{ id, classId, name, createdAt }]
     */
    @GET
    @Path("/classes/{classId}/modules")
    public Response getAll(@PathParam("classId") Long classId) {
        if (!auth.ownsClass(classId)) {
            return Response.status(403).entity(Map.of("error", "Kein Zugriff")).build();
        }

        var list = Module.findByClassId(classId).stream().map(m -> Map.of(
                "id",        m.id,
                "classId",   m.classId,
                "name",      m.name,
                "createdAt", m.createdAt.toString()
        )).toList();

        return Response.ok(list).build();
    }

    /**
     * POST /api/classes/:classId/modules
     * Body: { name }
     * Response: { id, classId, name, createdAt }
     */
    @POST
    @Path("/classes/{classId}/modules")
    @Transactional
    public Response create(@PathParam("classId") Long classId, ModuleRequest req) {
        if (!auth.ownsClass(classId)) {
            return Response.status(403).entity(Map.of("error", "Kein Zugriff")).build();
        }
        if (req.name() == null || req.name().isBlank()) {
            return Response.status(400).entity(Map.of("error", "Name darf nicht leer sein")).build();
        }

        Module m = new Module();
        m.classId = classId;
        m.name = req.name();
        m.persist();

        return Response.status(201).entity(Map.of(
                "id",        m.id,
                "classId",   m.classId,
                "name",      m.name,
                "createdAt", m.createdAt.toString()
        )).build();
    }

    /**
     * DELETE /api/modules/:moduleId
     */
    @DELETE
    @Path("/modules/{moduleId}")
    @Transactional
    public Response delete(@PathParam("moduleId") Long moduleId) {
        Module m = Module.findById(moduleId);
        if (m == null || !auth.ownsClass(m.classId)) {
            return Response.status(404).entity(Map.of("error", "Nicht gefunden")).build();
        }
        // Cascade: Antworten → Fragen → Hausaufgaben, Prüfungen, Informationen → Modul
        Question.findByModuleId(moduleId).forEach(q -> Answer.delete("questionId", q.id));
        Question.delete("moduleId", moduleId);
        Homework.delete("moduleId", moduleId);
        Exam.delete("moduleId", moduleId);
        Info.delete("moduleId", moduleId);
        m.delete();
        return Response.noContent().build();
    }
}
