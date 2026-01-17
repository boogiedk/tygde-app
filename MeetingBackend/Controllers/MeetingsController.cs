using Microsoft.AspNetCore.Mvc;
using MeetingBackend.DTOs;
using MeetingBackend.Services;

namespace MeetingBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MeetingsController : ControllerBase
{
    private readonly IMeetingService _meetingService;
    private readonly ILogger<MeetingsController> _logger;

    public MeetingsController(IMeetingService meetingService, ILogger<MeetingsController> logger)
    {
        _meetingService = meetingService;
        _logger = logger;
    }

    /// <summary>
    /// Создать новую встречу
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(MeetingResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<MeetingResponse>> CreateMeeting([FromBody] CreateMeetingRequest request)
    {
        try
        {
            var meeting = await _meetingService.CreateMeetingAsync(request);
            return CreatedAtAction(nameof(GetMeeting), new { id = meeting.Id }, meeting);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Ошибка валидации при создании встречи");
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Ошибка при создании встречи");
            return StatusCode(500, new { error = "Внутренняя ошибка сервера" });
        }
    }

    /// <summary>
    /// Получить информацию о встрече по ID
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(MeetingResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<MeetingResponse>> GetMeeting(Guid id)
    {
        try
        {
            var meeting = await _meetingService.GetMeetingByIdAsync(id);
            
            if (meeting == null)
            {
                return NotFound(new { error = "Встреча не найдена" });
            }

            return Ok(meeting);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Ошибка при получении встречи {MeetingId}", id);
            return StatusCode(500, new { error = "Внутренняя ошибка сервера" });
        }
    }
}
