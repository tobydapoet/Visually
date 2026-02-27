FROM eclipse-temurin:17-jdk

WORKDIR /app

COPY target/*.jar app.jar


EXPOSE 8082

ENTRYPOINT ["sh","-c","java $JAVA_OPTS -jar app.jar"]
#ENTRYPOINT ["java", "-jar", "app.jar"]
