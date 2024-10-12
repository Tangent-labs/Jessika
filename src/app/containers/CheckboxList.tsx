import { Checkbox } from '@/components/ui/checkbox';
export type KeyDisplayKey = {
    key: string;
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
            key={item.key}
            className={'flex items-center space-x-2 ' + className}
        >
            <Checkbox
                id={item.key}
                checked={item.checked}
                onClick={() => onClick(item.key)}
            />
            <label htmlFor={item.key} className="text-sm font-medium">
                {item.displayKey}
            </label>
        </div>
    ));
}
