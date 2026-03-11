import { Checkbox } from '@/components/ui/checkbox';
export type AddressDisplayKeyChecked = {
    address: string;
    displayKey: string;
    checked: boolean;
};

export default function CheckboxList({
    className,
    list,
    onClick,
}: {
    className?: string;
    list: AddressDisplayKeyChecked[];
    onClick: (item: string) => void;
}) {
    return list.map((item) => (
        <div
            key={item.address}
            className={'flex items-center space-x-2 ' + className}
        >
            <Checkbox
                id={item.address}
                checked={item.checked}
                onClick={() => onClick(item.address)}
            />
            <label htmlFor={item.address} className="text-sm font-medium">
                {item.displayKey}
            </label>
        </div>
    ));
}
