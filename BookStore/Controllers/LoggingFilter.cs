using BookStore.Connection;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using System.ComponentModel;
using System.IdentityModel.Tokens.Jwt;
using System.Threading.Tasks;
using BookStore.Model;
using System.Security.Claims;


namespace BookStore.Controllers
{


    public class LoggingFilter : IAsyncActionFilter
    {
        private readonly _dbContext _context;
        public LoggingFilter(_dbContext context)
        {
            _context = context;
        }
        public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            var httpContext = context.HttpContext;
            string token = httpContext.Request.Cookies["jwtToken"];

            if (!string.IsNullOrEmpty(token))
            {
                var controllerName = context.RouteData.Values["controller"];
                var actionName = context.RouteData.Values["action"];

                var handler = new JwtSecurityTokenHandler();
                var jwtToken = handler.ReadJwtToken(token);

                // Correct claim type for userId
                var userId = jwtToken.Claims.FirstOrDefault(c => c.Type == JwtRegisteredClaimNames.Sub)?.Value;
                var role = jwtToken.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Role)?.Value;
                await _context.AddDocumentAsync(new Log
                {
                    Name = userId,
                    Role = role,
                    DToc = DateTime.Now,
                }, "Log");
                httpContext.Response.Cookies.Append("UserToken", token, new CookieOptions
                {
                    HttpOnly = false,
                    Secure = true, // Only if you're using HTTPS
                    SameSite = SameSiteMode.Lax, // or None if cross-site needed
                    Expires = DateTime.UtcNow.AddMinutes(5)
                });
            }

            // Continue executing the original action
            await next();
        }
    }

}
