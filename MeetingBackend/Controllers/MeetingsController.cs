using Microsoft.AspNetCore.Mvc;
using MeetingBackend.DTOs;
using MeetingBackend.Services;

namespace MeetingBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MeetingsController : ControllerBase
{
    private readonly IMeetingService _meetingService;
    private readonly IParticipantService _participantService;
    private readonly ILogger<MeetingsController> _logger;

    public MeetingsController(
        IMeetingService meetingService,
        IParticipantService participantService,
        ILogger<MeetingsController> logger)
    {
        _meetingService = meetingService;
        _participantService = participantService;
        _logger = logger;
    }

    /// <summary>
    /// Создать новую встречу (с auto-join создателя)
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(CreateMeetingResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<CreateMeetingResponse>> CreateMeeting([FromBody] CreateMeetingRequest request)
    {
        try
        {
            var result = await _meetingService.CreateMeetingAsync(request);
            return CreatedAtAction(nameof(GetMeetingPreview), new { id = result.Meeting.Id }, result);
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
    /// Превью встречи (публичный, без PIN)
    /// </summary>
    [HttpGet("{id:guid}/preview")]
    [ProducesResponseType(typeof(MeetingPreviewResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<MeetingPreviewResponse>> GetMeetingPreview(Guid id)
    {
        try
        {
            var preview = await _participantService.GetMeetingPreviewAsync(id);
            if (preview == null)
                return NotFound(new { error = "Встреча не найдена" });

            return Ok(preview);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Ошибка при получении превью встречи {MeetingId}", id);
            return StatusCode(500, new { error = "Внутренняя ошибка сервера" });
        }
    }

    /// <summary>
    /// Присоединиться к встрече (проверка PIN)
    /// </summary>
    [HttpPost("{id:guid}/join")]
    [ProducesResponseType(typeof(JoinMeetingResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<JoinMeetingResponse>> JoinMeeting(Guid id, [FromBody] JoinMeetingRequest request)
    {
        try
        {
            var result = await _participantService.JoinMeetingAsync(id, request);
            return Ok(result);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { error = "Встреча не найдена" });
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized(new { error = "Неверный PIN-код" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Ошибка при присоединении к встрече {MeetingId}", id);
            return StatusCode(500, new { error = "Внутренняя ошибка сервера" });
        }
    }

    /// <summary>
    /// Проверить токен участника
    /// </summary>
    [HttpPost("{id:guid}/verify")]
    [ProducesResponseType(typeof(VerifyTokenResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<VerifyTokenResponse>> VerifyToken(Guid id, [FromBody] VerifyTokenRequest request)
    {
        try
        {
            var result = await _participantService.VerifyTokenAsync(id, request.Token);
            if (result == null)
                return Unauthorized(new { error = "Недействительный токен" });

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Ошибка при верификации токена для встречи {MeetingId}", id);
            return StatusCode(500, new { error = "Внутренняя ошибка сервера" });
        }
    }

    /// <summary>
    /// Получить список участников
    /// </summary>
    [HttpGet("{id:guid}/participants")]
    [ProducesResponseType(typeof(List<ParticipantResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<ParticipantResponse>>> GetParticipants(Guid id)
    {
        try
        {
            var participants = await _participantService.GetParticipantsAsync(id);
            return Ok(participants);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Ошибка при получении участников встречи {MeetingId}", id);
            return StatusCode(500, new { error = "Внутренняя ошибка сервера" });
        }
    }

    /// <summary>
    /// Покинуть встречу
    /// </summary>
    [HttpPost("{id:guid}/leave")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> LeaveMeeting(Guid id, [FromBody] LeaveRequest request)
    {
        try
        {
            var result = await _participantService.LeaveMeetingAsync(id, request.Token);
            if (!result)
                return NotFound(new { error = "Участник не найден" });

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Ошибка при выходе из встречи {MeetingId}", id);
            return StatusCode(500, new { error = "Внутренняя ошибка сервера" });
        }
    }

    /// <summary>
    /// Обновить геолокацию участника
    /// </summary>
    [HttpPut("{id:guid}/participants/location")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateLocation(Guid id, [FromBody] UpdateLocationRequest request)
    {
        try
        {
            var result = await _participantService.UpdateLocationAsync(id, request);
            if (!result)
                return NotFound(new { error = "Участник не найден" });

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Ошибка при обновлении геолокации для встречи {MeetingId}", id);
            return StatusCode(500, new { error = "Внутренняя ошибка сервера" });
        }
    }
}
