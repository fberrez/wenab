import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app/app.module";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Set global prefix first
  const globalPrefix = "api";
  app.setGlobalPrefix(globalPrefix);

  const config = new DocumentBuilder()
    .setTitle("WENAB")
    .setDescription(
      "A privacy-focused, open-source, self-hostable budgeting application."
    )
    .setVersion("1.0")
    // If you have authentication and want to secure Swagger UI or add Bearer auth option:
    // .addBearerAuth()
    .build();

  // Create the document after global prefix is set
  const document = SwaggerModule.createDocument(app, config);

  // Setup Swagger UI with the generated document
  SwaggerModule.setup("docs", app, document); // Pass the document directly

  const port = process.env.PORT || 3000;
  await app.listen(port);
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`
  );
  Logger.log(`📚 Swagger docs available at: http://localhost:${port}/docs`); // Added log for Swagger UI
}

bootstrap();
