using MeetingBackend.DTOs;
using MeetingBackend.Models;
using MeetingBackend.Repositories;

namespace MeetingBackend.Services;

public class MeetingService : IMeetingService
{
    private readonly IMeetingRepository _repository;

    public MeetingService(IMeetingRepository repository)
    {
        _repository = repository;
    }

    public async Task<MeetingResponse> CreateMeetingAsync(CreateMeetingRequest request)
    {
        // Валидация
        if (string.IsNullOrWhiteSpace(request.Title))
            throw new ArgumentException("Название встречи обязательно");

        if (request.DateTime == default)
            throw new ArgumentException("Укажите дату и время встречи");

        if (request.Location == null || 
            string.IsNullOrWhiteSpace(request.Location.Address))
            throw new ArgumentException("Укажите место встречи");

        // Создание сущности
        var meeting = new Meeting
        {
            Id = Guid.NewGuid(),
            Title = request.Title,
            Description = request.Description,
            DateTime = request.DateTime,
            Latitude = request.Location.Latitude,
            Longitude = request.Location.Longitude,
            Address = request.Location.Address,
            CreatedAt = DateTime.UtcNow
        };

        var created = await _repository.CreateMeetingAsync(meeting);

        return MapToResponse(created);
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
