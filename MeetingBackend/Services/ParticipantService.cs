using System.Security.Cryptography;
using System.Text;
using MeetingBackend.DTOs;
using MeetingBackend.Models;
using MeetingBackend.Repositories;

namespace MeetingBackend.Services;

public class ParticipantService : IParticipantService
{
    private readonly IParticipantRepository _participantRepository;
    private readonly IMeetingRepository _meetingRepository;

    private static readonly string[] Colors = new[]
    {
        "#FF6B6B", "#4ECDC4", "#FFE66D", "#A78BFA", "#F97316",
        "#06B6D4", "#EC4899", "#84CC16", "#F43F5E", "#8B5CF6",
        "#14B8A6", "#EAB308", "#6366F1", "#22C55E", "#E11D48"
    };

    private static readonly string[] Adjectives = new[]
    {
        "Алый", "Синий", "Бирюзовый", "Золотой", "Изумрудный",
        "Серебряный", "Лиловый", "Оранжевый", "Багровый", "Лазурный",
        "Медный", "Янтарный", "Нефритовый", "Рубиновый", "Сапфировый"
    };

    private static readonly string[] Animals = new[]
    {
        "Тигр", "Волк", "Медведь", "Лис", "Орёл",
        "Ястреб", "Барс", "Лев", "Кот", "Сокол",
        "Рысь", "Олень", "Дельфин", "Пантера", "Филин",
        "Ворон", "Кречет", "Бизон", "Мустанг", "Кобра"
    };

    public ParticipantService(
        IParticipantRepository participantRepository,
        IMeetingRepository meetingRepository)
    {
        _participantRepository = participantRepository;
        _meetingRepository = meetingRepository;
    }

    public async Task<JoinMeetingResponse> JoinMeetingAsync(Guid meetingId, JoinMeetingRequest request)
    {
        var meeting = await _meetingRepository.GetMeetingByIdAsync(meetingId);
        if (meeting == null)
            throw new KeyNotFoundException("Встреча не найдена");

        var pinHash = HashPin(request.Pin);
        if (meeting.PinHash != pinHash)
            throw new UnauthorizedAccessException("Неверный PIN-код");

        var participant = await CreateParticipantAsync(meetingId, request.Latitude, request.Longitude);

        var participants = await _participantRepository.GetByMeetingIdAsync(meetingId);
        var meetingResponse = MapToFullResponse(meeting, participants);

        return new JoinMeetingResponse
        {
            Participant = MapToParticipantResponse(participant),
            Meeting = meetingResponse,
            Token = participant.Id.ToString()
        };
    }

    public async Task<VerifyTokenResponse?> VerifyTokenAsync(Guid meetingId, string token)
    {
        if (!Guid.TryParse(token, out var participantId))
            return null;

        var participant = await _participantRepository.GetByIdAsync(participantId);
        if (participant == null || participant.MeetingId != meetingId || !participant.IsActive)
            return null;

        // Обновляем LastSeenAt
        participant.LastSeenAt = DateTime.UtcNow;
        await _participantRepository.UpdateAsync(participant);

        var meeting = await _meetingRepository.GetMeetingByIdAsync(meetingId);
        if (meeting == null)
            return null;

        var participants = await _participantRepository.GetByMeetingIdAsync(meetingId);

        return new VerifyTokenResponse
        {
            Participant = MapToParticipantResponse(participant),
            Meeting = MapToFullResponse(meeting, participants)
        };
    }

    public async Task<List<ParticipantResponse>> GetParticipantsAsync(Guid meetingId)
    {
        var participants = await _participantRepository.GetByMeetingIdAsync(meetingId);
        return participants.Select(MapToParticipantResponse).ToList();
    }

    public async Task<bool> LeaveMeetingAsync(Guid meetingId, string token)
    {
        if (!Guid.TryParse(token, out var participantId))
            return false;

        var participant = await _participantRepository.GetByIdAsync(participantId);
        if (participant == null || participant.MeetingId != meetingId)
            return false;

        participant.IsActive = false;
        await _participantRepository.UpdateAsync(participant);
        return true;
    }

    public async Task<bool> UpdateLocationAsync(Guid meetingId, UpdateLocationRequest request)
    {
        if (!Guid.TryParse(request.Token, out var participantId))
            return false;

        var participant = await _participantRepository.GetByIdAsync(participantId);
        if (participant == null || participant.MeetingId != meetingId || !participant.IsActive)
            return false;

        participant.Latitude = request.Latitude;
        participant.Longitude = request.Longitude;
        participant.LastSeenAt = DateTime.UtcNow;
        await _participantRepository.UpdateAsync(participant);
        return true;
    }

    public async Task<MeetingPreviewResponse?> GetMeetingPreviewAsync(Guid meetingId)
    {
        var meeting = await _meetingRepository.GetMeetingByIdAsync(meetingId);
        if (meeting == null)
            return null;

        var participants = await _participantRepository.GetByMeetingIdAsync(meetingId);

        return new MeetingPreviewResponse
        {
            Id = meeting.Id,
            Title = meeting.Title,
            DateTime = meeting.DateTime,
            ParticipantCount = participants.Count(p => p.IsActive)
        };
    }

    public async Task<Participant> CreateParticipantAsync(Guid meetingId, double? latitude, double? longitude)
    {
        var existingParticipants = await _participantRepository.GetByMeetingIdAsync(meetingId);
        var usedNames = existingParticipants.Select(p => p.DisplayName).ToHashSet();
        var usedColors = existingParticipants.Select(p => p.Color).ToHashSet();

        var (name, color) = GenerateUniqueNameAndColor(usedNames, usedColors);

        var participant = new Participant
        {
            Id = Guid.NewGuid(),
            MeetingId = meetingId,
            DisplayName = name,
            Color = color,
            Latitude = latitude,
            Longitude = longitude,
            JoinedAt = DateTime.UtcNow,
            LastSeenAt = DateTime.UtcNow,
            IsActive = true
        };

        await _participantRepository.CreateAsync(participant);
        return participant;
    }

    private static (string Name, string Color) GenerateUniqueNameAndColor(
        HashSet<string> usedNames, HashSet<string> usedColors)
    {
        var random = new Random();
        var color = Colors.FirstOrDefault(c => !usedColors.Contains(c))
                    ?? Colors[random.Next(Colors.Length)];

        string name;
        var attempts = 0;
        do
        {
            var adj = Adjectives[random.Next(Adjectives.Length)];
            var animal = Animals[random.Next(Animals.Length)];
            name = $"{adj} {animal}";
            attempts++;
        } while (usedNames.Contains(name) && attempts < 100);

        return (name, color);
    }

    public static string HashPin(string pin)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(pin));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }

    private static ParticipantResponse MapToParticipantResponse(Participant p) => new()
    {
        Id = p.Id,
        DisplayName = p.DisplayName,
        Color = p.Color,
        Latitude = p.Latitude,
        Longitude = p.Longitude,
        JoinedAt = p.JoinedAt,
        IsActive = p.IsActive
    };

    private static MeetingFullResponse MapToFullResponse(Meeting meeting, List<Participant> participants) => new()
    {
        Id = meeting.Id,
        Title = meeting.Title,
        Description = meeting.Description,
        DateTime = meeting.DateTime,
        Location = new LocationDto
        {
            Latitude = meeting.Latitude,
            Longitude = meeting.Longitude,
            Address = meeting.Address
        },
        CreatedAt = meeting.CreatedAt,
        Participants = participants.Select(MapToParticipantResponse).ToList()
    };
}
