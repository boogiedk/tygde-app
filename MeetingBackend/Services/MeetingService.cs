using MeetingBackend.DTOs;
using MeetingBackend.Models;
using MeetingBackend.Repositories;

namespace MeetingBackend.Services;

public class MeetingService : IMeetingService
{
    private readonly IMeetingRepository _repository;
    private readonly ParticipantService _participantService;

    public MeetingService(IMeetingRepository repository, ParticipantService participantService)
    {
        _repository = repository;
        _participantService = participantService;
    }

    public async Task<CreateMeetingResponse> CreateMeetingAsync(CreateMeetingRequest request)
    {
        // Валидация
        if (string.IsNullOrWhiteSpace(request.Title))
            throw new ArgumentException("Название встречи обязательно");

        if (request.DateTime == default)
            throw new ArgumentException("Укажите дату и время встречи");

        if (request.Location == null ||
            string.IsNullOrWhiteSpace(request.Location.Address))
            throw new ArgumentException("Укажите место встречи");

        if (string.IsNullOrWhiteSpace(request.Pin) || request.Pin.Length != 4 || !request.Pin.All(char.IsDigit))
            throw new ArgumentException("PIN должен содержать ровно 4 цифры");

        // Создание встречи
        var meeting = new Meeting
        {
            Id = Guid.NewGuid(),
            Title = request.Title,
            Description = request.Description,
            DateTime = request.DateTime,
            Latitude = request.Location.Latitude,
            Longitude = request.Location.Longitude,
            Address = request.Location.Address,
            CreatedAt = DateTime.UtcNow,
            PinHash = ParticipantService.HashPin(request.Pin)
        };

        var created = await _repository.CreateMeetingAsync(meeting);

        // Auto-join создателя
        var participant = await _participantService.CreateParticipantAsync(
            created.Id, request.Latitude, request.Longitude);

        return new CreateMeetingResponse
        {
            Meeting = new MeetingFullResponse
            {
                Id = created.Id,
                Title = created.Title,
                Description = created.Description,
                DateTime = created.DateTime,
                Location = new LocationDto
                {
                    Latitude = created.Latitude,
                    Longitude = created.Longitude,
                    Address = created.Address
                },
                CreatedAt = created.CreatedAt,
                Participants = new List<ParticipantResponse>
                {
                    new()
                    {
                        Id = participant.Id,
                        DisplayName = participant.DisplayName,
                        Color = participant.Color,
                        Latitude = participant.Latitude,
                        Longitude = participant.Longitude,
                        JoinedAt = participant.JoinedAt,
                        IsActive = participant.IsActive
                    }
                }
            },
            Participant = new ParticipantResponse
            {
                Id = participant.Id,
                DisplayName = participant.DisplayName,
                Color = participant.Color,
                Latitude = participant.Latitude,
                Longitude = participant.Longitude,
                JoinedAt = participant.JoinedAt,
                IsActive = participant.IsActive
            },
            Token = participant.Id.ToString()
        };
    }

    public async Task<MeetingResponse?> GetMeetingByIdAsync(Guid id)
    {
        var meeting = await _repository.GetMeetingByIdAsync(id);
        return meeting == null ? null : MapToResponse(meeting);
    }

    private static MeetingResponse MapToResponse(Meeting meeting)
    {
        return new MeetingResponse
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
            CreatedAt = meeting.CreatedAt
        };
    }
}
