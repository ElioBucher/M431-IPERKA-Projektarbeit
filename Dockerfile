# Stage 1: Build
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build
COPY pom.xml .
COPY src ./src
RUN mvn package -DskipTests -B

# Stage 2: Runtime
FROM eclipse-temurin:21-jre-jammy
WORKDIR /deployments
RUN mkdir -p /deployments/db
COPY --from=build /build/target/quarkus-app/ /deployments/
EXPOSE 8080
ENTRYPOINT ["java", \
    "-Dquarkus.http.host=0.0.0.0", \
    "-Djava.util.logging.manager=org.jboss.logmanager.LogManager", \
    "-jar", "/deployments/quarkus-run.jar"]
