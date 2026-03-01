FROM eclipse-temurin:17-jdk

WORKDIR /app

COPY target/*.jar app.jar

EXPOSE 9000

ENTRYPOINT ["java", "-jar", "app.jar"]

#FROM maven:3.9-eclipse-temurin-17 AS build
#
#WORKDIR /app
#COPY pom.xml .
#COPY src ./src
#
#
#FROM eclipse-temurin:17-jre-alpine
#
#WORKDIR /app
#COPY --from=build /app/target/*.jar app.jar
#
#EXPOSE 9000
#
#ENTRYPOINT ["java","-XX:+UseContainerSupport","-XX:MaxRAMPercentage=75.0","-jar","app.jar"]