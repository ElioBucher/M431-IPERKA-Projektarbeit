package ch.bbzw.classhub.resource;

import ch.bbzw.classhub.model.Info;
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
public class InfoResource {

    @Inject
    AuthHelper auth;

    public record InfoRequest(String title, String content) {}

    /**
     * GET /api/modules/:moduleId/infos
     * Response: [{ id, module_id, title, content, created_at }]
     */
    @GET
    @Path("/modules/{moduleId}/infos")
    public Response getAll(@PathParam("moduleId") Long moduleId) {
        Module m = Module.findById(moduleId);
        if (m == null || !auth.ownsClass(m.classId)) {
            return Response.status(404).entity(Map.of("error", "Nicht gefunden")).build();
        }

        var list = Info.findByModuleId(moduleId).stream().map(i -> Map.of(
                "id",         i.id,
                "module_id",  i.moduleId,
                "title",      i.title,
                "content",    i.content != null ? i.content : "",
                "created_at", i.createdAt.toString()
        )).toList();

        return Response.ok(list).build();
    }

    /**
     * POST /api/modules/:moduleId/infos
     * Body: { title, content? }
     */
    @POST
    @Path("/modules/{moduleId}/infos")
    @Transactional
    public Response create(@PathParam("moduleId") Long moduleId, InfoRequest req) {
        Module m = Module.findById(moduleId);
        if (m == null || !auth.ownsClass(m.classId)) {
            return Response.status(404).entity(Map.of("error", "Nicht gefunden")).build();
        }
        if (req.title() == null || req.title().isBlank()) {
            return Response.status(400).entity(Map.of("error", "Titel erforderlich")).build();
        }

        Info i = new Info();
        i.moduleId = moduleId;
        i.title    = req.title();
        i.content  = req.content();
        i.persist();

        return Response.status(201).entity(Map.of(
                "id",         i.id,
                "module_id",  i.moduleId,
                "title",      i.title,
                "content",    i.content != null ? i.content : "",
                "created_at", i.createdAt.toString()
        )).build();
    }

    /**
     * PUT /api/modules/:moduleId/infos/:id
     * Body: { title, content? }
     */
    @PUT
    @Path("/modules/{moduleId}/infos/{id}")
    @Transactional
    public Response update(@PathParam("moduleId") Long moduleId, @PathParam("id") Long id, InfoRequest req) {
        Info i = Info.findById(id);
        if (i == null || !i.moduleId.equals(moduleId)) {
            return Response.status(404).entity(Map.of("error", "Nicht gefunden")).build();
        }
        Module m = Module.findById(i.moduleId);
        if (m == null || !auth.ownsClass(m.classId)) {
            return Response.status(403).entity(Map.of("error", "Kein Zugriff")).build();
        }
        if (req.title() == null || req.title().isBlank()) {
            return Response.status(400).entity(Map.of("error", "Titel erforderlich")).build();
        }
        i.title   = req.title();
        i.content = req.content();
        return Response.ok(Map.of(
                "id",         i.id,
                "module_id",  i.moduleId,
                "title",      i.title,
                "content",    i.content != null ? i.content : "",
                "created_at", i.createdAt.toString()
        )).build();
    }

    /**
     * DELETE /api/modules/:moduleId/infos/:id
     */
    @DELETE
    @Path("/modules/{moduleId}/infos/{id}")
    @Transactional
    public Response delete(@PathParam("moduleId") Long moduleId, @PathParam("id") Long id) {
        Info i = Info.findById(id);
        if (i == null || !i.moduleId.equals(moduleId)) {
            return Response.status(404).entity(Map.of("error", "Nicht gefunden")).build();
        }

        Module m = Module.findById(i.moduleId);
        if (m == null || !auth.ownsClass(m.classId)) {
            return Response.status(403).entity(Map.of("error", "Kein Zugriff")).build();
        }

        i.delete();
        return Response.noContent().build();
    }
}
