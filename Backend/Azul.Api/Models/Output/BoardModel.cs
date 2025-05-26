using AutoMapper;
using Azul.Core.BoardAggregate;
using Azul.Core.BoardAggregate.Contracts;
using Azul.Core.TileFactoryAggregate.Contracts;
using System.Collections.Generic;
using System.Linq;

namespace Azul.Api.Models.Output;

public class BoardModel
{
    public List<List<TileSpotModel>> Wall { get; set; }
    public List<PatternLineModel> PatternLines { get; set; }
    public List<TileSpotModel> FloorLine { get; set; }
    public int Score { get; set; }

    private class MappingProfile : Profile
    {
        public MappingProfile()
        {
            // Global converter for TileSpot[,] to List<List<TileSpotModel>>
            // This tells AutoMapper how to handle this specific conversion whenever it encounters it.
            CreateMap<TileSpot[,], List<List<TileSpotModel>>>().ConvertUsing<WallConverter>();

            // Mapping for IBoard to BoardModel
            // AutoMapper will use the WallConverter defined above for the Wall property automatically.
            CreateMap<IBoard, BoardModel>()
                .ForMember(dest => dest.Wall, opt => opt.MapFrom(src => src.Wall))
                .ForMember(dest => dest.PatternLines, opt => opt.MapFrom(src => src.PatternLines))
                .ForMember(dest => dest.FloorLine, opt => opt.MapFrom(src => src.FloorLine));
            
            // Assuming PatternLineModel has its own mapping from IPatternLine, and
            // TileSpotModel has its own mapping from TileSpot.
        }
    }
}

// Custom Type Converter for TileSpot[,] to List<List<TileSpotModel>>
public class WallConverter : ITypeConverter<TileSpot[,], List<List<TileSpotModel>>>
{
    public List<List<TileSpotModel>> Convert(TileSpot[,] source, List<List<TileSpotModel>> destination, ResolutionContext context)
    {
        if (source == null) return null;

        // If destination is null, AutoMapper might expect us to create it.
        // However, for collection types, it's often better to let AutoMapper handle destination creation if possible,
        // or ensure it's newed up here.
        destination = new List<List<TileSpotModel>>(source.GetLength(0)); // Pre-allocate capacity

        for (int i = 0; i < source.GetLength(0); i++)
        {
            var rowList = new List<TileSpotModel>(source.GetLength(1)); // Pre-allocate capacity
            for (int j = 0; j < source.GetLength(1); j++)
            {
                // Use ResolutionContext to map the inner TileSpot to TileSpotModel
                rowList.Add(context.Mapper.Map<TileSpotModel>(source[i, j]));
            }
            destination.Add(rowList);
        }
        return destination;
    }
}

// If PatternLineModel is not defined in this namespace or accessible via using statements,
// it would still cause an error. Assuming PatternLineModel is a known type.
// For example:
// public class PatternLineModel 
// {
//     public TileType? TileType { get; set; }
//     public int NumberOfTiles { get; set; }
//     public int Capacity { get; set; }
// }
// And a mapping: CreateMap<IPatternLine, PatternLineModel>();