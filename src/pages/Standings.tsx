export default function Standings(){
    return (
      <div className="space-y-6">
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          <div className="bg-card text-card-foreground rounded-2xl p-5">
            <p className="text-sm text-muted">Total Races</p>
            <div className="text-4xl font-bold mt-3">0</div>
            <p className="text-xs text-muted mt-1">0 remaining</p>
          </div>
          <div className="bg-card rounded-2xl p-5">
            <p className="text-sm text-muted">Championship Leader</p>
            <div className="text-3xl font-extrabold mt-3 leading-tight">No drivers</div>
            <p className="text-xs text-muted mt-1">0 points</p>
          </div>
          <div className="bg-card rounded-2xl p-5">
            <p className="text-sm text-muted">Most Wins</p>
            <div className="text-4xl font-bold mt-3">0</div>
            <p className="text-xs text-muted mt-1">No drivers</p>
          </div>
        </div>
  
        <div className="bg-card rounded-2xl p-6 border border-border">
          <h2 className="text-lg font-semibold">Driver Standings</h2>
          <p className="text-sm text-muted mt-1">Current championship standings for all drivers</p>
          <div className="mt-8 flex justify-center">
            <button className="px-4 py-2 rounded-xl bg-white text-black text-sm font-medium">
              + Add Your First Driver
            </button>
          </div>
        </div>
      </div>
    );
  }
  