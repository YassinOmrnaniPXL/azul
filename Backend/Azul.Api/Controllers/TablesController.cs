using AutoMapper;
using Azul.Api.Models.Output;
using Azul.Core.TableAggregate;
using Azul.Core.TableAggregate.Contracts;
using Azul.Core.UserAggregate;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Linq;
using Microsoft.AspNetCore.Authorization;

namespace Azul.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class TablesController : ApiControllerBase
{
    private readonly ITableManager _tableManager;
    private readonly ITableRepository _tableRepository;
    private readonly IMapper _mapper;
    private readonly UserManager<User> _userManager;

    public TablesController(ITableManager tableManager, ITableRepository tableRepository, IMapper mapper, UserManager<User> userManager)
    {
        _tableManager = tableManager;
        _tableRepository = tableRepository;
        _mapper = mapper;
        _userManager = userManager;
    }

    /// <summary>
    /// Gets a specific table by its id.
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(TableModel), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public IActionResult GetTableById(Guid id)
    {
        ITable table = _tableRepository.Get(id);
        TableModel model = _mapper.Map<TableModel>(table);
        return Ok(model);
    }

    /// <summary>
    /// Gets a list of all available public tables that players can join.
    /// </summary>
    [HttpGet("all-joinable")]
    [ProducesResponseType(typeof(IEnumerable<TableModel>), StatusCodes.Status200OK)]
    public IActionResult GetAllJoinableTables()
    {
        // Diagnostic logging for authentication
        Console.WriteLine($"[DEBUG] TablesController.GetAllJoinableTables called");
        Console.WriteLine($"[DEBUG] User.Identity.IsAuthenticated: {User.Identity.IsAuthenticated}");
        Console.WriteLine($"[DEBUG] User.Identity.Name: {User.Identity.Name ?? "null"}");
        
        if (!User.Identity.IsAuthenticated)
        {
            Console.WriteLine($"[DEBUG] User is NOT authenticated - examining available claims:");
            foreach (var claim in User.Claims)
            {
                Console.WriteLine($"[DEBUG] Claim: {claim.Type} = {claim.Value}");
            }
            // Return unauthorized but continue processing for diagnostic purposes
            Console.WriteLine($"[DEBUG] Would normally return 401 here, but continuing for diagnostics");
        }

        IEnumerable<ITable> tables = _tableRepository.GetAllJoinableTables();
        
        var tableModels = _mapper.Map<IEnumerable<TableModel>>(tables);
        return Ok(tableModels);
    }

    /// <summary>
    /// Searches a table with available seats that matches the given preferences.
    /// If such a table is found, the user joins it.
    /// If no table is found, a new table is created and the user joins the new table.
    /// If the table has no available seats left, the game is started.
    /// </summary>
    /// <param name="preferences">
    /// Contains info about the type of game you want to play.
    /// </param>
    /// <remarks>Tables are automatically removed from the system after 15 minutes.</remarks>
    [HttpPost("join-or-create")]
    [ProducesResponseType(typeof(TableModel), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorModel), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> JoinOrCreate([FromBody] TablePreferences preferences)
    {
        User currentUser = await _userManager.GetUserAsync(User);
        if (currentUser == null)
        {
            return Unauthorized(new ErrorModel { Message = "User not authenticated or could not be found." });
        }

        ITable table = _tableManager.JoinOrCreateTable(currentUser, preferences);

        TableModel tableModel = _mapper.Map<TableModel>(table);
        return Ok(tableModel);
    }

    /// <summary>
    /// Allows the host of a table to start the game once the table is full.
    /// </summary>
    /// <param name="tableId">The unique identifier of the table.</param>
    [HttpPost("{tableId}/start-game")]
    [ProducesResponseType(typeof(TableModel), StatusCodes.Status200OK)] // Or just 200OK if no body needed
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> StartGame(Guid tableId)
    {
        User currentUser = (await _userManager.GetUserAsync(User))!;
        if (currentUser == null) return Unauthorized();

        ITable table = _tableRepository.Get(tableId); // Get the table
        if (table == null) return NotFound(new ErrorModel { Message = "Table not found." });

        // Check if the current user is the host (HostPlayerId needs to be on ITable)
        if (table.HostPlayerId != currentUser.Id)
        {
            return Forbid(); // User is not the host
        }

        if (table.GameId != Guid.Empty)
        {
            return BadRequest(new ErrorModel { Message = "Game has already started for this table." });
        }

        if (table.HasAvailableSeat)
        {
            return BadRequest(new ErrorModel { Message = "Table is not full yet. Cannot start game." });
        }

        _tableManager.StartGameForTable(table.Id, currentUser.Id);
        
        // Fetch the table again to get the updated state with GameId
        ITable updatedTable = _tableRepository.Get(tableId);
        TableModel tableModel = _mapper.Map<TableModel>(updatedTable);

        return Ok(tableModel); // Return updated table model, which now includes the gameId
    }

    /// <summary>
    /// Joins a specific table by its ID.
    /// </summary>
    /// <param name="tableId">The unique identifier of the table to join.</param>
    [HttpPost("{tableId}/join")]
    [ProducesResponseType(typeof(TableModel), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorModel), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> JoinSpecificTable(Guid tableId)
    {
        User currentUser = await _userManager.GetUserAsync(User);
        if (currentUser == null)
        {
            return Unauthorized(new ErrorModel { Message = "User not authenticated or could not be found." });
        }

        try
        {
            ITable table = _tableRepository.Get(tableId);
            if (table == null)
            {
                return NotFound(new ErrorModel { Message = "Table not found." });
            }

            if (!table.HasAvailableSeat)
            {
                return BadRequest(new ErrorModel { Message = "Table is full and has no available seats." });
            }

            if (table.GameId != Guid.Empty)
            {
                return BadRequest(new ErrorModel { Message = "Game has already started for this table." });
            }

            // Check if user is already seated at this table
            if (table.SeatedPlayers.Any(p => p.Id == currentUser.Id))
            {
                return BadRequest(new ErrorModel { Message = "You are already seated at this table." });
            }

            table.Join(currentUser);
            _tableRepository.Update(table);

            TableModel tableModel = _mapper.Map<TableModel>(table);
            return Ok(tableModel);
        }
        catch (Azul.Core.Util.DataNotFoundException)
        {
            return NotFound(new ErrorModel { Message = "Table not found or no longer exists." });
        }
        catch (Exception ex)
        {
            return BadRequest(new ErrorModel { Message = $"Failed to join table: {ex.Message}" });
        }
    }

    /// <summary>
    /// Removes the user that is logged in from a table.
    /// If no players are left at the table, the table is removed from the system.
    /// </summary>
    /// <param name="id">
    /// The unique identifier of the table.
    /// </param>
    [HttpPost("{id}/leave")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ErrorModel), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Leave(Guid id)
    {
        User currentUser = (await _userManager.GetUserAsync(User))!;
        _tableManager.LeaveTable(id, currentUser);
        return Ok();
    }
}