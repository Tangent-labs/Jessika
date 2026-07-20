import VlSdtFeesClaim from './VlSdtFeesClaim';

export default function MultisigProcesses({ className }: { className: string }) {
    return (
        <div className={className}>
            <div className="grid grid-cols-2 gap-12">
                <VlSdtFeesClaim />
            </div>
        </div>
    );
}
