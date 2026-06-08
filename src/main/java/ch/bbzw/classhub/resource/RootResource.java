package ch.bbzw.classhub.resource;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.core.Response;
import java.net.URI;

/**
 * Redirect root URL to the static index page so visiting / shows the app
 */
@Path("/")
public class RootResource {

    @GET
    public Response root() {
        return Response.seeOther(URI.create("/index.html")).build();
    }
}

