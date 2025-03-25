import './doctorCard.css';

interface DoctorCardProps {
    name: string;
    picture: string;
    logicMagic: () => void;
}

const DoctorCard = ({ name, picture, logicMagic }: DoctorCardProps) => {
    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
        // Fallback to placeholder image on error
        e.currentTarget.src = '/placeholder-doctor.png';
        // Remove error handler to prevent infinite loop if placeholder also fails
        e.currentTarget.onerror = null;
    };

    return (
        <div className="doctor-card">
            <div className="doctor-card__image-container">
                <img 
                    src={picture}
                    alt={name}
                    className="doctor-card__image"
                    onError={handleImageError}
                />
            </div>
            <div className="doctor-card__content">
                <h3 className="doctor-card__name">{name}</h3>
                <button className="doctor-card__button" onClick={logicMagic}>
                    Consult
                </button>
            </div>
        </div>
    );
};

export default DoctorCard;