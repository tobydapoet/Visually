FROM eclipse-temurin:17-jdk

WORKDIR /app

COPY target/*.jar app.jar

EXPOSE 8088

#ENTRYPOINT ["java","-jar","app.jar"]
ENTRYPOINT ["sh","-c","java $JAVA_OPTS -jar app.jar"]