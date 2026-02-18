# getDate 

Get the current date. Default variable is _getDate without options.

## Shorthand Documentation for new Linux Command-line Tool

```text
*****************************************************************************************************************
getDate 

Get the current date. Default variable is _getDate without options.

NOTE - when using options the variable "_getDate" will not ouput.
NOTE - only one option per type of date (day, month, quarter, year) will work i.e. /Y/LY will not work.
       Additionally, if specified in the description; some options are independent and will only work alone.

  ******Default Variables by Output******
  * _getDate                            *
  **********In Order of Output***********
  * _theTwoDigitDate                    * 
  * _lastMonth                          *   
  * _theMonth                           *
  * _theQuarter                         *
  * _theYear                            *
  ***************************************

Usage: getDate [1] [2] [3]                           
       > getDate [1]  -  [ [/D] [/DM] [/LM] [/LQ] [/LY] [/M] [/Q] [/Y] | [0 | 1] ]
                         [ --full | --slash | --leap | --clear-var | [-e] [/?] ]
                 [2]  -  [ [0 | 1] [-e] [-abbrv] | [-d-m-y] | [-t, --two-digit] | [--season] ]
                         [ [-v] [var] | --edit-all ]
                 [3]  -  [ [0 | 1] [-v] [var] ]

Parameter List: 
*****************************************************************************************************************
 Parameter            Description
  -e                   Edit file. Must be used with "/?" in [1]. 
  /?                   Show help for executable.
  --edit-all           As [2] with -e [1] - edit executable and help file.
  /D                   Get the day of the month as two digits.
  /DM                  Get the two digit month.
                        NOTE - this option is independent and only works with /D.
  /LM                  Get the full name of last month.  
  /LQ                  Get the last fiscal quarter relative to the current date.
                        NOTE - this option is independent and only works by itself (i.e. /LQ/M won't work).
  /LY                  Get the four digit year of last year.
  /M                   Get the full name of the current month.
  /NY                  Get the four digit for next year.
                        NOTE - this option is independent and only works by itself (i.e. /NY/M won't work).
  /Q                   Get the current quarter.
  /T                   Get the date digits as output by terminal (i.e. MM/DD/YYYY)
                        NOTE - this option is independent and only works by itself (i.e. /T/M won't work).
  /Y                   Get the four digit year.
  --full               As [1]. Get the default date, but four digit year instead of two digit year.
  --slash              Store value of default variable "_getDate" with forward slash, not dash.
                       e.g. "MM/DD/YY" not "MM-DD-YY".
  -v                   As [2][3] with --slash [1]. Use the alternate variable for slash dates "_getSlashDate".
  var                  As [2][3] with --slash [1]. Use the custom variable for slash dates.
  --leap               Check if year is a leap year, and store 1 (yes) or 0 (no) to
                       variable _checkLeapYear.
                        NOTE - additional arguments have no affect.
  --clear-var          Clears all getDate variables that have been previously set in a session.
  0,1                  Silent output. 0 to silent. 1 to output. Default is 1.  
  -abbrv               Abbreviate the month. 
                        IMPORTANT - only works of [/M] is used.
  -d-m-y               As [2] with /T [1]. Set the order that day, month, and year are output.
                        EXAMPLES - -y-m-d, -d-y-m, -m-y-d, etc..
                        IMPORTANT - must be all lowercase.
  -t, --two-digit      Used with [/Y]. Get the last two digits of current year.
  --season             Used with [/Q]. Gets the corresponding season for quarter.
                        NOTE - ouput is stored in variable "_theQuarter".
                        NOTE - works with all options that can use [/Q]
 
Use Example:
*****************************************************************************************************************
 > getDate
   - returns MM-DD-YY, and stores value in default variable "_getDate".
 > getDate --full
   - returns MM-DD-YYYY, and stores value in second class default variable "_getFullDate".
 > getDate --slash
   - returns MM/DD/YY, and stores value in default variable "_getDate"
 > getDate --slash -v
   - returns MM/DD/YY, and stores value in alternate variable "_getSlashDate".
 > getDate --slash _var
   - returns MM/DD/YY, and stores value in custom variable "_var"
 > getDate /M/D
   - returns full name of month, two digit day of month, and date as "MM-DD-YY"
 > getDate /M/Q/Y 1
   - returns name of month, quarter, and four digit year.    
 > getDate /LM 0
   - stores the full name of last month in variable "_lastMonth".
 > getDate /T
   - get the date digits as output by terminal where MM/DD/YYYY is returned; not MM-DD-YY.
 > getDate /? -e
   - edit getdate help file.

*****************************************************************************************************************
*****************************************************************************************************************
```
