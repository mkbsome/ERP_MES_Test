"""
Time Manager for Data Generation
Handles time-based patterns, shifts, and calendar management
"""
from datetime import datetime, timedelta, date
from typing import Optional, Dict, Any, List, Generator
from dataclasses import dataclass
from enum import Enum
import yaml
from pathlib import Path


class ShiftType(Enum):
    DAY = "DAY"
    EVENING = "EVENING"
    NIGHT = "NIGHT"


@dataclass
class Shift:
    """Shift configuration"""
    id: str
    name: str
    start_hour: int
    end_hour: int
    break_minutes: int
    production_factor: float
    quality_factor: float
    workers_available: float


@dataclass
class TimeSlot:
    """Represents a specific time slot for data generation"""
    timestamp: datetime
    date: date
    hour: int
    shift: ShiftType
    is_working_day: bool
    is_holiday: bool
    day_of_week: int  # 1=Monday, 7=Sunday
    week_of_year: int
    month: int
    quarter: int
    production_factor: float
    quality_factor: float


class TimeManager:
    """Manages time-based operations for data generation"""

    def __init__(self, config_path: Optional[str] = None):
        self.config: Dict[str, Any] = {}
        self.shifts: Dict[ShiftType, Shift] = {}
        self.holidays: List[date] = []
        self.working_days: List[int] = [1, 2, 3, 4, 5, 6]  # Mon-Sat

        if config_path:
            self.load_config(config_path)
        else:
            self._set_defaults()

    def load_config(self, config_path: str) -> None:
        """Load time configuration from YAML file"""
        with open(config_path, 'r', encoding='utf-8') as f:
            self.config = yaml.safe_load(f)

        self._parse_config()

    def _set_defaults(self) -> None:
        """Set default configuration"""
        self.start_date = datetime(2024, 7, 1)
        self.end_date = datetime(2024, 12, 31)

        self.shifts = {
            ShiftType.DAY: Shift(
                id="DAY", name="주간",
                start_hour=8, end_hour=16,
                break_minutes=60,
                production_factor=1.0,
                quality_factor=1.0,
                workers_available=1.0
            ),
            ShiftType.EVENING: Shift(
                id="EVENING", name="오후",
                start_hour=16, end_hour=24,
                break_minutes=60,
                production_factor=0.95,
                quality_factor=1.1,
                workers_available=0.95
            ),
            ShiftType.NIGHT: Shift(
                id="NIGHT", name="야간",
                start_hour=0, end_hour=8,
                break_minutes=60,
                production_factor=0.85,
                quality_factor=1.3,
                workers_available=0.8
            ),
        }

    def _parse_config(self) -> None:
        """Parse loaded configuration"""
        sim_config = self.config.get('simulation', {})
        self.start_date = datetime.strptime(sim_config.get('start_date', '2024-07-01'), '%Y-%m-%d')
        self.end_date = datetime.strptime(sim_config.get('end_date', '2024-12-31'), '%Y-%m-%d')

        # Parse holidays
        calendar_config = self.config.get('calendar', {})
        self.working_days = calendar_config.get('working_days', [1, 2, 3, 4, 5, 6])
        self.holiday_production_rate = calendar_config.get('holiday_production_rate', 0.3)

        for holiday_str in calendar_config.get('holidays', []):
            self.holidays.append(datetime.strptime(holiday_str, '%Y-%m-%d').date())

        # Parse shifts
        shifts_config = self.config.get('shifts', {})
        if shifts_config.get('enabled', True):
            for shift_key in ['day', 'evening', 'night']:
                shift_data = shifts_config.get(shift_key, {})
                if shift_data:
                    shift_type = ShiftType[shift_data.get('id', shift_key.upper())]
                    start_time = shift_data.get('start', '08:00')
                    end_time = shift_data.get('end', '16:00')

                    self.shifts[shift_type] = Shift(
                        id=shift_data.get('id', shift_key.upper()),
                        name=shift_data.get('name', shift_key),
                        start_hour=int(start_time.split(':')[0]),
                        end_hour=int(end_time.split(':')[0]) if end_time != '00:00' else 24,
                        break_minutes=shift_data.get('break_minutes', 60),
                        production_factor=shift_data.get('production_factor', 1.0),
                        quality_factor=shift_data.get('quality_factor', 1.0),
                        workers_available=shift_data.get('workers_available', 1.0)
                    )

        # Parse patterns
        self.patterns = self.config.get('patterns', {})

    def get_shift(self, hour: int) -> ShiftType:
        """Determine shift based on hour"""
        if 8 <= hour < 16:
            return ShiftType.DAY
        elif 16 <= hour < 24:
            return ShiftType.EVENING
        else:  # 0 <= hour < 8
            return ShiftType.NIGHT

    def get_shift_config(self, shift: ShiftType) -> Shift:
        """Get shift configuration"""
        return self.shifts.get(shift, self.shifts[ShiftType.DAY])

    def is_working_day(self, dt: datetime) -> bool:
        """Check if the given date is a working day"""
        day_of_week = dt.isoweekday()  # 1=Monday, 7=Sunday
        return day_of_week in self.working_days

    def is_holiday(self, dt: datetime) -> bool:
        """Check if the given date is a holiday"""
        return dt.date() in self.holidays

    def get_hourly_factor(self, hour: int) -> float:
        """Get hourly production factor"""
        hourly_factors = self.patterns.get('daily', {}).get('hourly_factors', {})
        hour_str = f"{hour:02d}"
        return hourly_factors.get(hour_str, 1.0)

    def get_daily_factor(self, day_of_week: int) -> float:
        """Get daily production factor (1=Monday)"""
        daily_factors = self.patterns.get('weekly', {}).get('daily_factors', {})
        return daily_factors.get(day_of_week, 1.0)

    def get_quarterly_factor(self, month: int) -> float:
        """Get quarterly demand factor"""
        quarterly_factors = self.patterns.get('seasonal', {}).get('quarterly_factors', {})
        quarter = f"Q{(month - 1) // 3 + 1}"
        return quarterly_factors.get(quarter, 1.0)

    def is_end_of_month(self, dt: datetime) -> bool:
        """Check if date is in end-of-month period"""
        monthly_config = self.patterns.get('monthly', {})
        end_days = monthly_config.get('end_of_month_days', 3)

        # Calculate last day of month
        if dt.month == 12:
            next_month = datetime(dt.year + 1, 1, 1)
        else:
            next_month = datetime(dt.year, dt.month + 1, 1)
        last_day = (next_month - timedelta(days=1)).day

        return dt.day > last_day - end_days

    def get_end_of_month_factor(self) -> float:
        """Get end-of-month production factor"""
        return self.patterns.get('monthly', {}).get('end_of_month_factor', 1.15)

    def calculate_production_factor(self, dt: datetime) -> float:
        """Calculate total production factor for given datetime"""
        factor = 1.0

        # Hourly factor
        factor *= self.get_hourly_factor(dt.hour)

        # Daily factor (day of week)
        factor *= self.get_daily_factor(dt.isoweekday())

        # Quarterly factor
        factor *= self.get_quarterly_factor(dt.month)

        # End of month factor
        if self.is_end_of_month(dt):
            factor *= self.get_end_of_month_factor()

        # Holiday factor
        if self.is_holiday(dt):
            factor *= self.holiday_production_rate

        # Shift factor
        shift = self.get_shift(dt.hour)
        shift_config = self.get_shift_config(shift)
        factor *= shift_config.production_factor

        return factor

    def calculate_quality_factor(self, dt: datetime) -> float:
        """Calculate quality factor (higher = more defects)"""
        shift = self.get_shift(dt.hour)
        shift_config = self.get_shift_config(shift)
        return shift_config.quality_factor

    def get_time_slot(self, dt: datetime) -> TimeSlot:
        """Get time slot information for given datetime"""
        shift = self.get_shift(dt.hour)

        return TimeSlot(
            timestamp=dt,
            date=dt.date(),
            hour=dt.hour,
            shift=shift,
            is_working_day=self.is_working_day(dt),
            is_holiday=self.is_holiday(dt),
            day_of_week=dt.isoweekday(),
            week_of_year=dt.isocalendar()[1],
            month=dt.month,
            quarter=(dt.month - 1) // 3 + 1,
            production_factor=self.calculate_production_factor(dt),
            quality_factor=self.calculate_quality_factor(dt)
        )

    def iterate_time_slots(
        self,
        start: Optional[datetime] = None,
        end: Optional[datetime] = None,
        interval: timedelta = timedelta(hours=1)
    ) -> Generator[TimeSlot, None, None]:
        """
        Iterate through time slots within the simulation period

        Args:
            start: Start datetime (defaults to simulation start)
            end: End datetime (defaults to simulation end)
            interval: Time interval between slots

        Yields:
            TimeSlot for each time point
        """
        current = start or self.start_date
        end_dt = end or self.end_date

        while current <= end_dt:
            yield self.get_time_slot(current)
            current += interval

    def iterate_days(
        self,
        start: Optional[datetime] = None,
        end: Optional[datetime] = None,
        include_holidays: bool = True
    ) -> Generator[date, None, None]:
        """
        Iterate through days in the simulation period

        Args:
            start: Start date
            end: End date
            include_holidays: Whether to include holidays

        Yields:
            date objects
        """
        current = (start or self.start_date).date()
        end_date = (end or self.end_date).date()

        while current <= end_date:
            if include_holidays or current not in self.holidays:
                yield current
            current += timedelta(days=1)

    def get_simulation_summary(self) -> Dict[str, Any]:
        """Get summary of simulation time configuration"""
        total_days = (self.end_date - self.start_date).days + 1
        working_days = sum(
            1 for d in self.iterate_days()
            if self.is_working_day(datetime.combine(d, datetime.min.time()))
            and d not in self.holidays
        )

        return {
            "start_date": self.start_date.isoformat(),
            "end_date": self.end_date.isoformat(),
            "total_days": total_days,
            "working_days": working_days,
            "holidays": len(self.holidays),
            "shifts": [s.name for s in self.shifts.values()]
        }
