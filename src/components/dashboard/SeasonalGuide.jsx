import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Leaf, Sun, Wind, Droplets, Calendar, ArrowRight } from "lucide-react";

const seasonIcons = {
  spring: Leaf,
  summer: Sun,
  fall: Wind,
  winter: Droplets,
  year_round: Calendar
};

const seasonColors = {
  spring: "from-green-500 to-emerald-500",
  summer: "from-yellow-500 to-orange-500",
  fall: "from-orange-500 to-red-500",
  winter: "from-blue-500 to-cyan-500",
  year_round: "from-gray-500 to-slate-500"
};

export default React.memo(function SeasonalGuide({ season, guides }) {
  const SeasonIcon = seasonIcons[season] || Calendar;
  const colorClass = seasonColors[season] || seasonColors.year_round;
  
  const seasonGuides = React.useMemo(() => 
    guides.filter(g => 
      g.season?.includes(season) || g.season?.includes('year_round')
    ).slice(0, 3),
    [season, guides]
  );

  return (
    <Card className="border-none shadow-lg bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className={`w-10 h-10 bg-gradient-to-br ${colorClass} rounded-lg flex items-center justify-center`}>
            <SeasonIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="text-xl font-bold capitalize">{season === 'year_round' ? 'Year Round' : season} Season Guide</div>
            <p className="text-sm text-gray-500 font-normal">Essential tasks for this season</p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {seasonGuides.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No guides available for this season yet</p>
        ) : (
          <>
            {seasonGuides.map(guide => (
              <Link 
                key={guide.id}
                to={createPageUrl(`GuideDetail?id=${guide.id}`)}
                className="block group"
              >
                <div className="flex items-start justify-between p-4 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50/50 transition-all duration-200">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 group-hover:text-green-700 transition-colors">
                      {guide.title}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{guide.description}</p>
                    <Badge variant="outline" className="mt-2">
                      {guide.category.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 flex-shrink-0 ml-4 transition-colors" />
                </div>
              </Link>
            ))}
            <Link to={createPageUrl("Guides")}>
              <Button variant="outline" className="w-full">
                View All Guides
              </Button>
            </Link>
          </>
        )}
      </CardContent>
    </Card>
  );
});