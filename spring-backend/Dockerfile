FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app
# Copy pom.xml và tải các thư viện trước (giúp cache layer Docker nhanh hơn)
COPY pom.xml .
RUN mvn dependency:go-offline

# Copy source code, chạy test rồi build file .jar
COPY src ./src
RUN mvn clean package

# Stage 2: Chỉ lấy file .jar để chạy (giúp image nhẹ hơn)
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
