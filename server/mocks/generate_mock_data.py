import os
import sys
import uuid
import random
from passlib.context import CryptContext

# Align system paths to allow clean root directory package execution
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db.database import SessionLocal, engine, Base
from domains.users.models import User
from domains.groups.models import Group
from domains.parameters.models import Parameter
from core.logger import logger

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def seed_system_mock_data():
    """
    Automated relational database seeder logic. Spawns 1 Admin, 1 Group,
    2 Trainers, 6 Trainees, 2 Raw Parameters, and 1 Virtual Parameter calculation row.
    Injects dynamic randomized Lorem Picsum asset URLs for profiles and group avatars.
    """
    logger.info("Initializing relational mock data injection script context...")
    db = SessionLocal()

    try:
        # 1. Generate uniform encrypted password hash for password token "1"
        shared_password_hash = pwd_context.hash("1")

        # 2. Spawn and persist the Global System Administrator
        admin_user = User(
            id=uuid.uuid4(),
            username="admin",
            password=shared_password_hash,
            role="admin",
            first_name="System",
            second_name="Administrator",
            email="admin@mitamnim.com",
            profile_picture=f"https://picsum.photos/150/150?random={uuid.uuid4()}",
            group_id=None
        )
        db.add(admin_user)
        logger.info("Admin entity staged with dynamic avatar preset.")

        # 3. Spawn Core Training Group
        mock_group = Group(
            id=uuid.uuid4(),
            name="Iron Warriors Elite",
            group_image=f"https://picsum.photos/800/400?random={random.randint(100, 999)}"
        )
        db.add(mock_group)
        db.flush()  # Extract secure Group UUID key context safely
        logger.info(f"Group 'Iron Warriors Elite' persisted with id: {mock_group.id}")

        # 4. Spawn 2 Trainers attached to the Group
        trainers = []
        for i in range(1, 3):
            trainer_node = User(
                id=uuid.uuid4(),
                username=f"trainer{i}",
                password=shared_password_hash,
                role="trainer",
                first_name=f"Coach",
                second_name=f"Alpha {i}",
                email=f"trainer{i}@mitamnim.com",
                profile_picture=f"https://picsum.photos/150/150?random=trainer_{i}",
                group_id=mock_group.id
            )
            db.add(trainer_node)
            trainers.append(trainer_node)

        logger.info("2 Group Trainers staged successfully with unique avatars.")

        # 5. Spawn 3 Trainees for each Trainer inside the Group (Total: 6 Trainees)
        trainee_counter = 1
        for trainer_node in trainers:
            for _ in range(3):
                trainee_node = User(
                    id=uuid.uuid4(),
                    username=f"trainee{trainee_counter}",
                    password=shared_password_hash,
                    role="trainee",
                    first_name=f"Athlete",
                    second_name=f"Number-{trainee_counter}",
                    email=f"trainee{trainee_counter}@mitamnim.com",
                    profile_picture=f"https://picsum.photos/150/150?random=trainee_{trainee_counter}",
                    group_id=mock_group.id
                )
                db.add(trainee_node)
                trainee_counter += 1

        logger.info("6 Isolated Trainee athlete profiles staged successfully with unique avatars.")

        # 6. Spawn Base Logging Parameters (Reps and Weight)
        reps_param = Parameter(
            name="Reps",
            unit="reps",
            group_id=mock_group.id,
            aggregation_strategy="sum",
            is_virtual=False
        )
        weight_param = Parameter(
            name="Weight",
            unit="kg",
            group_id=mock_group.id,
            aggregation_strategy="max",
            is_virtual=False
        )

        db.add(reps_param)
        db.add(weight_param)
        db.flush()  # Extract auto-increment integer IDs from the DB engine sequencers
        logger.info(f"Base metrics generated. Reps ID: {reps_param.id} | Weight ID: {weight_param.id}")

        # 7. Spawn Advanced Virtual Computed Parameter (Total Volume = Weight * Reps)
        total_volume_param = Parameter(
            name="Total Volume",
            unit="kg",
            group_id=mock_group.id,
            aggregation_strategy="sum",
            is_virtual=True,
            calculation_type="multiply",
            source_parameter_ids=[reps_param.id, weight_param.id],
            multiplier=1.0
        )
        db.add(total_volume_param)

        # 8. Commit atomic unit transaction sequence cleanly
        db.commit()
        logger.info("Database mock data transaction sequence committed successfully without collisions.")

    except Exception as e:
        db.rollback()
        logger.error(f"Seeding transaction failed mapping relations. Rollback issued: {str(e)}")
    finally:
        db.close()


if __name__ == "__main__":
    seed_system_mock_data()