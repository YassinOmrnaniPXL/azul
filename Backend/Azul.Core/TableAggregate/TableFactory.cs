using Azul.Core.TableAggregate.Contracts;
using Azul.Core.UserAggregate;

namespace Azul.Core.TableAggregate;

/// <inheritdoc cref="ITableFactory"/>
internal class TableFactory : ITableFactory
{
    public ITable CreateNewForUser(User user, ITablePreferences preferences)
    {
        var table = new Table(Guid.NewGuid(), preferences);
        (table as Table)!.GetType().GetProperty(nameof(ITable.HostPlayerId))!.SetValue(table, user.Id);
        table.Join(user);
        return table;
    }
}