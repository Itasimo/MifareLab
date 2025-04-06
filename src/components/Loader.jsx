/**
 * Loader component that displays an animated loading indicator
 * with customizable background transparency.
 * 
 * @component
 * @param {Object} props - Component props
 * @param {boolean} [props.transparentBackground=true] - Whether the background should be transparent
 * @returns {JSX.Element} A loading animation with ellipsis dots
 */
function Loader({ transparentBackground = true }) {
    return (
        <div
            className={`loader ${
                transparentBackground
                    ? 'bg-transparent'
                    : 'dark:bg-dark-primary bg-light-primary'
            }`}
        >
            {/* Loading animation with four bouncing dots */}
            <div className="lds-ellipsis">
                <div className="dark:bg-dark-text bg-light-text"></div>
                <div className="dark:bg-dark-text bg-light-text"></div>
                <div className="dark:bg-dark-text bg-light-text"></div>
                <div className="dark:bg-dark-text bg-light-text"></div>
            </div>
            {/* Scoped styles for the loading animation */}
            <style jsx="true">{`
                /* Container styles */
                .loader {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    width: 100%; /* Ensure it takes up the full width */
                    height: 100%; /* Ensure it takes up the full height */
                }
                /* Animation container */
                .lds-ellipsis {
                    display: inline-block;
                    position: relative;
                    width: 80px;
                    height: 80px;
                }
                /* Common styles for all dots */
                .lds-ellipsis div {
                    position: absolute;
                    top: 33px;
                    width: 13px;
                    height: 13px;
                    border-radius: 50%;
                    animation-timing-function: cubic-bezier(0, 1, 1, 0);
                }
                /* First dot - scales from 0 to 1 */
                .lds-ellipsis div:nth-child(1) {
                    left: 8px;
                    animation: lds-ellipsis1 0.6s infinite;
                }
                /* Second dot - moves from left to right */
                .lds-ellipsis div:nth-child(2) {
                    left: 8px;
                    animation: lds-ellipsis2 0.6s infinite;
                }
                /* Third dot - moves from left to right */
                .lds-ellipsis div:nth-child(3) {
                    left: 32px;
                    animation: lds-ellipsis2 0.6s infinite;
                }
                /* Fourth dot - scales from 1 to 0 */
                .lds-ellipsis div:nth-child(4) {
                    left: 56px;
                    animation: lds-ellipsis3 0.6s infinite;
                }
                /* Animation for first dot (grow) */
                @keyframes lds-ellipsis1 {
                    0% {
                        transform: scale(0);
                    }
                    100% {
                        transform: scale(1);
                    }
                }
                /* Animation for second and third dots (movement) */
                @keyframes lds-ellipsis2 {
                    0% {
                        transform: translate(0, 0);
                    }
                    100% {
                        transform: translate(24px, 0);
                    }
                }
                /* Animation for fourth dot (shrink) */
                @keyframes lds-ellipsis3 {
                    0% {
                        transform: scale(1);
                    }
                    100% {
                        transform: scale(0);
                    }
                }
            `}</style>
        </div>
    );
}

export default Loader;