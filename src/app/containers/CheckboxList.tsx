import { Checkbox } from '@/components/ui/checkbox';
export type KeyDisplayKey = {
    sdToken: string;
    displayKey: string;
    checked: boolean;
};

export default function CheckboxList({
    className,
    list,
    onClick,
}: {
    className?: string;
    list: KeyDisplayKey[];
    onClick: (item: string) => void;
}) {
    return list.map((item) => (
        <div
            key={item.sdToken}
            className={'flex items-center space-x-2 ' + className}
        >
            <Checkbox
                id={item.sdToken}
                checked={item.checked}
                onClick={() => onClick(item.sdToken)}
            />
            <label htmlFor={item.sdToken} className="text-sm font-medium">
                {item.displayKey}
            </label>
        </div>
    ));
}
