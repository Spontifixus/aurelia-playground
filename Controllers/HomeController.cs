using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace AureliaPlayground.Controllers
{
    public class HomeController : Controller
    {
        public IActionResult Index()
        {
            return this.View();
        }

        public IActionResult Error()
        {
            ViewData["RequestId"] = Activity.Current?.Id ?? HttpContext.TraceIdentifier;
            return this.View();
        }
    }
}
