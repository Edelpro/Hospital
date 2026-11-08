FROM node:24-alpine AS web-build
WORKDIR /src
COPY package.json package-lock.json ./
RUN npm ci
COPY angular.json tsconfig*.json ./
COPY public ./public
COPY src ./src
RUN npm run build

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS api-build
WORKDIR /src
COPY api/Hcu008.Api/Hcu008.Api/Hcu008.Api.csproj ./Hcu008.Api/
RUN dotnet restore ./Hcu008.Api/Hcu008.Api.csproj
COPY api/Hcu008.Api/Hcu008.Api/ ./Hcu008.Api/
RUN rm -rf ./Hcu008.Api/wwwroot && mkdir -p ./Hcu008.Api/wwwroot
COPY --from=web-build /src/dist/hcu008-emergencia/browser/ ./Hcu008.Api/wwwroot/
RUN dotnet publish ./Hcu008.Api/Hcu008.Api.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=api-build /app/publish .
RUN useradd --create-home --uid 10001 hcu008 && chown -R hcu008:hcu008 /app
USER hcu008
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD curl --fail http://localhost:8080/health/ready || exit 1
ENTRYPOINT ["dotnet", "Hcu008.Api.dll"]
