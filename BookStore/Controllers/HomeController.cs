using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using BookStore.Model;
using BookStore.Connection;
using MongoDB.Driver;
using BookStore.Controllers;

namespace BookStore.Controllers
{
    [Route("home")]
    [Route("/")]
    public class HomeController : Controller
    {
        private readonly _dbContext _context;

        public HomeController(_dbContext context)
        {
            _context = context;
        }

        [Route("/")]
        public async Task<IActionResult> Index()
        {
            if (Request.Cookies["jwtToken"] != null)
            {
                return RedirectToAction("Dashboard");
            }
            var collection = _context.GetCollection<Book>("Book");
            var model = await collection.Find(_ => true).ToListAsync();
            return View(model);
        }

        [Route("/login")]
        public IActionResult Login()
        {
            return View();
        }

        [Authorize]
        [ServiceFilter(typeof(LoggingFilter))]
        [Route("/Dashboard")]
        public async Task<IActionResult> Dashboard()
        {
            var collection = _context.GetCollection<Book>("Book");
            var model = await collection.Find(_ => true).ToListAsync();
            return View(model);
        }

        [HttpGet("/GetPdf")]
        //[ServiceFilter(typeof(LoggingFilter))]
        //[Authorize] 
        public async Task<IActionResult> GetPdf([FromQuery] string path)
        {
            if (string.IsNullOrEmpty(path))
                return BadRequest();

            // Normalize path (handle both forward and backward slashes)
            path = path.Replace("\\", "/");

            // Combine paths properly
            var fullPath = _env.WebRootPath, path.TrimStart('/');

            if (!System.IO.File.Exists(fullPath))
                return NotFound();

            return PhysicalFile(fullPath, "application/pdf");
        }

    }
}
