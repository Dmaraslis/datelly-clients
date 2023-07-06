export = QRCode

declare class QRCode {
    constructor(element: any, vOption: any);

    clear(): void;

    makeCode(text: string): void;
    
    resize(width: number, height: number): void;

    static CorrectLevel: {
        H: number;
        L: number;
        M: number;
        Q: number;
    };
}
