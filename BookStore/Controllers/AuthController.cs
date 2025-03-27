using BookStore.Connection;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;


namespace BookStore.Controllers
{
    [Route("/Auth")]
    public class AuthController : Controller
    {
        private readonly IConfiguration _config;
        private readonly _dbContext _context;

        public AuthController(IConfiguration config, _dbContext context)
        {
            _config = config;
            _context = context;
        }

        [HttpPost("/login")]
        public async Task<IActionResult> LoginVerfify(string email, string password)
        {
            var user = await _context.ValidateUserAsync(email, password);
            if (user != null) // Replace with DB validation
            {

                var token = GenerateJwtToken(user._id, user.Role);
                HttpContext.Response.Cookies.Append("jwtToken", token, new CookieOptions
                {
                    HttpOnly = false,
                    Secure = true, // Only if you're using HTTPS
                    SameSite = SameSiteMode.Lax, // or None if cross-site needed
                    Expires = DateTime.UtcNow.AddMinutes(5)
                });
                return RedirectToAction("Dashboard", "Home");
            }

            ViewBag.ErrorMessage = "Incorrect email or password";
            return View("Login");
        }

        private string GenerateJwtToken(string userId, string role)
        {
            var jwtSettings = _config.GetSection("JwtSettings");
            var key = Encoding.UTF8.GetBytes(jwtSettings["Key"]);

            var claims = new[]
            {
            new Claim(JwtRegisteredClaimNames.Sub, userId),
            new Claim(ClaimTypes.Role, role),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

            var token = new JwtSecurityToken(
                issuer: jwtSettings["Issuer"],
                audience: jwtSettings["Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(Convert.ToDouble(jwtSettings["ExpireMinutes"])),
                signingCredentials: new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256)
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
