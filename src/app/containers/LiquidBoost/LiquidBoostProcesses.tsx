import VlSdtFeesClaim from './VlSdtFeesClaim';
import CvgCvxFeesClaim from './CvgCvxFeesClaim';

export default function LiquidBoostProcesses({ className }: { className: string }) {
    return (
        <div className={className}>
            <div className="grid grid-cols-2 gap-12">
                <VlSdtFeesClaim />
                <CvgCvxFeesClaim />
            </div>
        </div>
    );
}
