# Stage 1: Build
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build
COPY pom.xml .
COPY src ./src
RUN mvn package -DskipTests -B \
    -Dquarkus.package.jar.type=uber-jar \
    -Dquarkus.package.output-name=app \
    && echo "=== Built JARs ===" \
    && find /build/target -name "*.jar" | sort

# Stage 2: Runtime
FROM eclipse-temurin:21-jre-jammy
WORKDIR /deployments
RUN mkdir -p /deployments/db
COPY --from=build /build/target/app-runner.jar /deployments/app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-Dquarkus.http.host=0.0.0.0", "-Djava.util.logging.manager=org.jboss.logmanager.LogManager", "-jar", "/deployments/app.jar"]
