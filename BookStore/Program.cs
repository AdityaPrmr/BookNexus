using BookStore.classes;
using BookStore.Connection;
using BookStore.Controllers;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllersWithViews();
builder.Services.AddSingleton<_dbContext>();
builder.Services.AddSingleton<LoggingFilter>();


var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var key = Encoding.UTF8.GetBytes(jwtSettings["Key"]);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(key)
    };

    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            context.Token = context.Request.Cookies["jwtToken"];
            return Task.CompletedTask;
        },
        OnAuthenticationFailed = context =>
        {
            context.Response.Redirect("/");
            return Task.CompletedTask; // ❌ No HandleResponse() here
        },
        OnChallenge = context =>
        {
            if (!context.Response.HasStarted)
            {
                context.Response.Redirect("/");
                context.HandleResponse(); // ✅ This is correct here
            }
            return Task.CompletedTask;
        }
    };

});

builder.Services.AddAuthorization();


var app = builder.Build();

app.UseHttpsRedirection();

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}

app.UseRouting();

app.UseAuthentication();
//app.UseMiddleware<Middleware>();
app.UseAuthorization();

app.MapControllers();
app.UseStaticFiles();


app.Run();