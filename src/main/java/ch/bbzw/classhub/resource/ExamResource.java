package ch.bbzw.classhub.resource;

import ch.bbzw.classhub.model.Exam;
import ch.bbzw.classhub.model.Module;
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
public class ExamResource {

    @Inject
    AuthHelper auth;

    public record ExamRequest(String topic, String examDate, String learningGoals) {}

    /**
     * GET /api/modules/:moduleId/exams
     * Response: [{ id, module_id, topic, examDate, learningGoals, createdAt }]
     */
    @GET
    @Path("/modules/{moduleId}/exams")
    public Response getAll(@PathParam("moduleId") Long moduleId) {
        Module m = Module.findById(moduleId);
        if (m == null || !auth.ownsClass(m.classId)) {
            return Response.status(404).entity(Map.of("error", "Nicht gefunden")).build();
        }

        var list = Exam.findByModuleId(moduleId).stream().map(e -> Map.of(
                "id",             e.id,
                "module_id",      e.moduleId,
                "topic",          e.title,
                "examDate",       e.examDate,
                "learningGoals",  e.topics != null ? e.topics : "",
                "createdAt",      e.createdAt.toString()
        )).toList();

        return Response.ok(list).build();
    }

    /**
     * POST /api/modules/:moduleId/exams
     * Body: { topic, examDate, learningGoals? }
     */
    @POST
    @Path("/modules/{moduleId}/exams")
    @Transactional
    public Response create(@PathParam("moduleId") Long moduleId, ExamRequest req) {
        Module m = Module.findById(moduleId);
        if (m == null || !auth.ownsClass(m.classId)) {
            return Response.status(404).entity(Map.of("error", "Nicht gefunden")).build();
        }
        if (req.topic() == null || req.topic().isBlank() || req.examDate() == null) {
            return Response.status(400).entity(Map.of("error", "Thema und Datum erforderlich")).build();
        }

        Exam e = new Exam();
        e.moduleId = moduleId;
        e.title    = req.topic();
        e.examDate = req.examDate();
        e.topics   = req.learningGoals();
        e.persist();

        return Response.status(201).entity(Map.of(
                "id",             e.id,
                "module_id",      e.moduleId,
                "topic",          e.title,
                "examDate",       e.examDate,
                "learningGoals",  e.topics != null ? e.topics : "",
                "createdAt",      e.createdAt.toString()
        )).build();
    }

    /**
     * PUT /api/modules/:moduleId/exams/:id
     * Body: { topic, examDate, learningGoals? }
     */
    @PUT
    @Path("/modules/{moduleId}/exams/{id}")
    @Transactional
    public Response update(@PathParam("moduleId") Long moduleId, @PathParam("id") Long id, ExamRequest req) {
        Exam e = Exam.findById(id);
        if (e == null || !e.moduleId.equals(moduleId)) {
            return Response.status(404).entity(Map.of("error", "Nicht gefunden")).build();
        }
        Module m = Module.findById(e.moduleId);
        if (m == null || !auth.ownsClass(m.classId)) {
            return Response.status(403).entity(Map.of("error", "Kein Zugriff")).build();
        }
        if (req.topic() == null || req.topic().isBlank() || req.examDate() == null) {
            return Response.status(400).entity(Map.of("error", "Thema und Datum erforderlich")).build();
        }
        e.title    = req.topic();
        e.examDate = req.examDate();
        e.topics   = req.learningGoals();
        return Response.ok(Map.of(
                "id",            e.id,
                "module_id",     e.moduleId,
                "topic",         e.title,
                "examDate",      e.examDate,
                "learningGoals", e.topics != null ? e.topics : "",
                "createdAt",     e.createdAt.toString()
        )).build();
    }

    /**
     * DELETE /api/modules/:moduleId/exams/:id
     */
    @DELETE
    @Path("/modules/{moduleId}/exams/{id}")
    @Transactional
    public Response delete(@PathParam("moduleId") Long moduleId, @PathParam("id") Long id) {
        Exam e = Exam.findById(id);
        if (e == null || !e.moduleId.equals(moduleId)) {
            return Response.status(404).entity(Map.of("error", "Nicht gefunden")).build();
        }

        Module m = Module.findById(e.moduleId);
        if (m == null || !auth.ownsClass(m.classId)) {
            return Response.status(403).entity(Map.of("error", "Kein Zugriff")).build();
        }

        e.delete();
        return Response.noContent().build();
    }
}
