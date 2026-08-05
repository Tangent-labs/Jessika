import SUsgStreaming from './SUsgStreaming';
import DumpFees from './DumpFees';
import UnpauseMarkets from './UnpauseMarkets';

export default function USGProcesses({ className }: { className: string }) {
    return (
        <div className={className}>
            <div className="grid grid-cols-2 gap-12">
                <SUsgStreaming />
                <DumpFees />
                <div className="col-span-2">
                    <UnpauseMarkets />
                </div>
            </div>
        </div>
    );
}
