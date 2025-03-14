using Azul.Api.Controllers;
using Guts.Client.Core;

namespace Azul.Api.Tests
{
    public class TablesControllerIntegrationTests : ControllerIntegrationTestsBase<TablesController>
    {
        [MonitoredTest]
        public void HappyFlow_UserAStartsATableWith2Seats_UserBJoins_AGameIsStartedAutomatically()
        {
            StartANewGameForANewTable();
        }
    }
}