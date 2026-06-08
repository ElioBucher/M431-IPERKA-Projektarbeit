package ch.bbzw.classhub.resource;

import ch.bbzw.classhub.model.Homework;
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
public class HomeworkResource {

    @Inject
    AuthHelper auth;

    public record HomeworkRequest(String title, String description, String dueDate) {}

    /**
     * GET /api/modules/:moduleId/homework
     * Response: [{ id, module_id, title, description, dueDate, createdAt }]
     */
    @GET
    @Path("/modules/{moduleId}/homework")
    public Response getAll(@PathParam("moduleId") Long moduleId) {
        Module m = Module.findById(moduleId);
        if (m == null || !auth.ownsClass(m.classId)) {
            return Response.status(404).entity(Map.of("error", "Nicht gefunden")).build();
        }

        var list = Homework.findByModuleId(moduleId).stream().map(h -> Map.of(
                "id",          h.id,
                "module_id",   h.moduleId,
                "title",       h.title,
                "description", h.description != null ? h.description : "",
                "dueDate",     h.dueDate,
                "createdAt",   h.createdAt.toString()
        )).toList();

        return Response.ok(list).build();
    }

    /**
     * POST /api/modules/:moduleId/homework
     * Body: { title, description?, dueDate }
     */
    @POST
    @Path("/modules/{moduleId}/homework")
    @Transactional
    public Response create(@PathParam("moduleId") Long moduleId, HomeworkRequest req) {
        Module m = Module.findById(moduleId);
        if (m == null || !auth.ownsClass(m.classId)) {
            return Response.status(404).entity(Map.of("error", "Nicht gefunden")).build();
        }
        if (req.title() == null || req.title().isBlank() || req.dueDate() == null) {
            return Response.status(400).entity(Map.of("error", "Titel und Datum erforderlich")).build();
        }

        Homework h = new Homework();
        h.moduleId    = moduleId;
        h.title       = req.title();
        h.description = req.description();
        h.dueDate     = req.dueDate();
        h.persist();

        return Response.status(201).entity(Map.of(
                "id",          h.id,
                "module_id",   h.moduleId,
                "title",       h.title,
                "description", h.description != null ? h.description : "",
                "dueDate",     h.dueDate,
                "createdAt",   h.createdAt.toString()
        )).build();
    }

    /**
     * PUT /api/modules/:moduleId/homework/:id
     * Body: { title, description?, dueDate }
     */
    @PUT
    @Path("/modules/{moduleId}/homework/{id}")
    @Transactional
    public Response update(@PathParam("moduleId") Long moduleId, @PathParam("id") Long id, HomeworkRequest req) {
        Homework h = Homework.findById(id);
        if (h == null || !h.moduleId.equals(moduleId)) {
            return Response.status(404).entity(Map.of("error", "Nicht gefunden")).build();
        }
        Module m = Module.findById(h.moduleId);
        if (m == null || !auth.ownsClass(m.classId)) {
            return Response.status(403).entity(Map.of("error", "Kein Zugriff")).build();
        }
        if (req.title() == null || req.title().isBlank() || req.dueDate() == null) {
            return Response.status(400).entity(Map.of("error", "Titel und Datum erforderlich")).build();
        }
        h.title       = req.title();
        h.description = req.description();
        h.dueDate     = req.dueDate();
        return Response.ok(Map.of(
                "id",          h.id,
                "module_id",   h.moduleId,
                "title",       h.title,
                "description", h.description != null ? h.description : "",
                "dueDate",     h.dueDate,
                "createdAt",   h.createdAt.toString()
        )).build();
    }

    /**
     * DELETE /api/modules/:moduleId/homework/:id
     */
    @DELETE
    @Path("/modules/{moduleId}/homework/{id}")
    @Transactional
    public Response delete(@PathParam("moduleId") Long moduleId, @PathParam("id") Long id) {
        Homework h = Homework.findById(id);
        if (h == null || !h.moduleId.equals(moduleId)) {
            return Response.status(404).entity(Map.of("error", "Nicht gefunden")).build();
        }

        Module m = Module.findById(h.moduleId);
        if (m == null || !auth.ownsClass(m.classId)) {
            return Response.status(403).entity(Map.of("error", "Kein Zugriff")).build();
        }

        h.delete();
        return Response.noContent().build();
    }
}
