# syntax=docker/dockerfile:1
# Stage 1: Build
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build
COPY pom.xml .
COPY src ./src
RUN mvn package -DskipTests -B
RUN echo "=== target/ ===" && find /build/target -maxdepth 3 | sort
RUN test -d /build/target/quarkus-app \
    && echo "quarkus-app OK" \
    || (echo "ERROR: quarkus-app not found after mvn package!" && exit 1)

# Stage 2: Runtime
FROM eclipse-temurin:21-jre-jammy
WORKDIR /deployments
RUN mkdir -p /deployments/db
COPY --from=build /build/target/quarkus-app/ /deployments/
EXPOSE 8080
ENTRYPOINT ["java", "-Dquarkus.http.host=0.0.0.0", "-Djava.util.logging.manager=org.jboss.logmanager.LogManager", "-jar", "/deployments/quarkus-run.jar"]
