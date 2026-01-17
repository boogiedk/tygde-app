# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy csproj and restore dependencies
COPY ["MeetingBackend.csproj", "./"]
RUN dotnet restore "MeetingBackend.csproj"

# Copy everything else and build
COPY . .
RUN dotnet publish "MeetingBackend.csproj" -c Release -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

# Expose port
EXPOSE 80
ENV ASPNETCORE_URLS=http://+:80

# Create directory for database
RUN mkdir -p /app/Data

ENTRYPOINT ["dotnet", "MeetingBackend.dll"]
