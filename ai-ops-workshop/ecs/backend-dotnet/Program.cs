using Microsoft.EntityFrameworkCore;
using TmsApi.Data;
using TmsApi.Models;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<TmsDbContext>(options =>
    options.UseNpgsql(connectionString));

var frontendUrl = builder.Configuration["FrontendUrl"] ?? "http://localhost:3000";
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(frontendUrl)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();
app.UseCors();
app.UseAuthorization();
app.MapControllers();

app.MapGet("/health", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }));

app.MapPost("/api/login", async (TmsDbContext db, LoginRequest request) =>
{
    var user = await db.Users.FirstOrDefaultAsync(u => u.Uid == request.Uid && u.Password == request.Password);
    if (user == null)
        return Results.Unauthorized();
    
    return Results.Ok(new { success = true, user = new { user.Id, user.Uid, user.Name, user.Email } });
});

app.MapPost("/api/timesheet", async (TmsDbContext db, TimesheetRequest request) =>
{
    var entry = new TimesheetEntry
    {
        UserId = request.UserId,
        Date = request.Date,
        Project = request.Project,
        Task = request.Task,
        Hours = request.Hours,
        Description = request.Description
    };
    
    db.TimesheetEntries.Add(entry);
    await db.SaveChangesAsync();
    
    return Results.Created($"/api/timesheet/{entry.Id}", entry);
});

app.MapGet("/api/timesheet", async (TmsDbContext db, int? userId) =>
{
    var query = db.TimesheetEntries.AsQueryable();
    if (userId.HasValue)
        query = query.Where(t => t.UserId == userId.Value);
    
    return Results.Ok(await query.OrderByDescending(t => t.Id).ToListAsync());
});

app.MapPost("/api/logout", () => Results.Ok(new { success = true }));

app.Run();

record LoginRequest(string Uid, string Password);
record TimesheetRequest(int UserId, string Date, string Project, string Task, decimal Hours, string? Description);
