package ch.bbzw.classhub.resource;

import ch.bbzw.classhub.model.Answer;
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
public class QuestionResource {

    @Inject
    AuthHelper auth;

    public record QuestionRequest(String questionText, String authorName) {}
    public record AnswerRequest(String answerText, String authorName) {}

    /**
     * GET /api/modules/:moduleId/questions
     * Response: [{ id, questionText, createdAt, answers: [{id, answerText, createdAt}] }]
     */
    @GET
    @Path("/modules/{moduleId}/questions")
    public Response getAll(@PathParam("moduleId") Long moduleId) {
        Module m = Module.findById(moduleId);
        if (m == null || !auth.ownsClass(m.classId)) {
            return Response.status(404).entity(Map.of("error", "Nicht gefunden")).build();
        }

        var list = Question.findByModuleId(moduleId).stream().map(q -> {
            var answers = Answer.findByQuestionId(q.id).stream().map(a -> {
                var am = new java.util.HashMap<String, Object>();
                am.put("id",         a.id);
                am.put("answerText", a.answer);
                am.put("authorName", a.authorName != null ? a.authorName : "");
                am.put("createdAt",  a.createdAt.toString());
                return am;
            }).toList();
            var qm = new java.util.HashMap<String, Object>();
            qm.put("id",           q.id);
            qm.put("questionText", q.question);
            qm.put("authorName",   q.authorName != null ? q.authorName : "");
            qm.put("createdAt",    q.createdAt.toString());
            qm.put("answers",      answers);
            return qm;
        }).toList();

        return Response.ok(list).build();
    }

    /**
     * POST /api/modules/:moduleId/questions
     * Body: { questionText }
     */
    @POST
    @Path("/modules/{moduleId}/questions")
    @Transactional
    public Response create(@PathParam("moduleId") Long moduleId, QuestionRequest req) {
        Module m = Module.findById(moduleId);
        if (m == null || !auth.ownsClass(m.classId)) {
            return Response.status(404).entity(Map.of("error", "Nicht gefunden")).build();
        }
        if (req.questionText() == null || req.questionText().isBlank()) {
            return Response.status(400).entity(Map.of("error", "Fragetext erforderlich")).build();
        }

        Question q = new Question();
        q.moduleId   = moduleId;
        q.question   = req.questionText();
        q.authorName = req.authorName();
        q.persist();

        var qm = new java.util.HashMap<String, Object>();
        qm.put("id",           q.id);
        qm.put("questionText", q.question);
        qm.put("authorName",   q.authorName != null ? q.authorName : "");
        qm.put("createdAt",    q.createdAt.toString());
        qm.put("answers",      java.util.List.of());
        return Response.status(201).entity(qm).build();
    }

    /**
     * DELETE /api/modules/:moduleId/questions/:id
     */
    @DELETE
    @Path("/modules/{moduleId}/questions/{id}")
    @Transactional
    public Response deleteQuestion(@PathParam("moduleId") Long moduleId, @PathParam("id") Long id) {
        Question q = Question.findById(id);
        if (q == null || !q.moduleId.equals(moduleId)) {
            return Response.status(404).entity(Map.of("error", "Nicht gefunden")).build();
        }

        Module m = Module.findById(q.moduleId);
        if (m == null || !auth.ownsClass(m.classId)) {
            return Response.status(403).entity(Map.of("error", "Kein Zugriff")).build();
        }

        // Erst alle Antworten löschen, dann die Frage
        Answer.delete("questionId", id);
        q.delete();
        return Response.noContent().build();
    }

    /**
     * POST /api/modules/:moduleId/questions/:questionId/answers
     * Body: { answerText }
     */
    @POST
    @Path("/modules/{moduleId}/questions/{questionId}/answers")
    @Transactional
    public Response createAnswer(@PathParam("moduleId") Long moduleId, @PathParam("questionId") Long questionId, AnswerRequest req) {
        Question q = Question.findById(questionId);
        if (q == null || !q.moduleId.equals(moduleId)) {
            return Response.status(404).entity(Map.of("error", "Frage nicht gefunden")).build();
        }

        Module m = Module.findById(q.moduleId);
        if (m == null || !auth.ownsClass(m.classId)) {
            return Response.status(403).entity(Map.of("error", "Kein Zugriff")).build();
        }
        if (req.answerText() == null || req.answerText().isBlank()) {
            return Response.status(400).entity(Map.of("error", "Antworttext erforderlich")).build();
        }

        Answer a = new Answer();
        a.questionId = questionId;
        a.answer     = req.answerText();
        a.authorName = req.authorName();
        a.persist();

        var am = new java.util.HashMap<String, Object>();
        am.put("id",         a.id);
        am.put("answerText", a.answer);
        am.put("authorName", a.authorName != null ? a.authorName : "");
        am.put("createdAt",  a.createdAt.toString());
        return Response.status(201).entity(am).build();
    }

    /**
     * DELETE /api/modules/:moduleId/answers/:id
     */
    @DELETE
    @Path("/modules/{moduleId}/answers/{id}")
    @Transactional
    public Response deleteAnswer(@PathParam("moduleId") Long moduleId, @PathParam("id") Long id) {
        Answer a = Answer.findById(id);
        if (a == null) return Response.status(404).entity(Map.of("error", "Nicht gefunden")).build();

        Question q = Question.findById(a.questionId);
        Module m = q != null ? Module.findById(q.moduleId) : null;
        if (m == null || !auth.ownsClass(m.classId)) {
            return Response.status(403).entity(Map.of("error", "Kein Zugriff")).build();
        }

        a.delete();
        return Response.noContent().build();
    }
}
