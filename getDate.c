#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include <sys/stat.h>
#include <sys/types.h>
#include <errno.h>

#define MAX_ARGS 256
#define MAX_LINE 512
#define MAX_ENTRIES 512

static const char *MONTHS[] = {
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
};

static const char *SEASONS[] = {"Winter", "Spring", "Summer", "Fall"};

typedef struct {
    char key[128];
    char value[256];
} Entry;

void show_help(void) {
    printf("getDate - get formatted date values and persist named variables\n\n");
    printf("Usage:\n  getDate.c [options] [0|1]\n\n");
    printf("Date options:\n");
    printf("  /D   Day of month (two digits)\n");
    printf("  /DM  Month as two digits (only valid with /D)\n");
    printf("  /LM  Last month name\n");
    printf("  /LQ  Last quarter (must be used alone)\n");
    printf("  /LY  Last year (4-digit)\n");
    printf("  /M   Current month name\n");
    printf("  /NY  Next year (must be used alone)\n");
    printf("  /Q   Current quarter\n");
    printf("  /T   Terminal date format MM/DD/YYYY (must be used alone)\n");
    printf("  /Y   Current year (4-digit, or 2-digit with -t/--two-digit)\n\n");
    printf("Flags:\n");
    printf("  --full        Default format uses YYYY (MM-DD-YYYY)\n");
    printf("  --slash       Default format uses / instead of -\n");
    printf("  --leap        Store leap check result in _checkLeapYear\n");
    printf("  --clear-var   Clear persisted getDate variables\n");
    printf("  -abbrv        Abbreviate month name (for /M)\n");
    printf("  -t, --two-digit  Two-digit year when used with /Y\n");
    printf("  --season      Use season name with /Q\n");
    printf("  -v [var]      With --slash default mode, use _getSlashDate or custom var name\n");
    printf("  /?            Show help\n");
    printf("  -e            With /? display edit hint\n");
}

int is_leap(int year) {
    return (year % 400 == 0) || (year % 4 == 0 && year % 100 != 0);
}

void split_option(const char *arg, char options[][8], int *count) {
    if (strchr(arg + 1, '/')) {
        char temp[128];
        strncpy(temp, arg, sizeof(temp) - 1);
        temp[sizeof(temp) - 1] = '\0';

        char *token = strtok(temp, "/");
        while (token != NULL) {
            if (strlen(token) > 0) {
                snprintf(options[*count], 8, "/%s", token);
                (*count)++;
            }
            token = strtok(NULL, "/");
        }
    } else {
        strncpy(options[*count], arg, 7);
        options[*count][7] = '\0';
        (*count)++;
    }
}

int ensure_dir(const char *path) {
#ifdef _WIN32
    return _mkdir(path);
#else
    return mkdir(path, 0755);
#endif
}

void build_paths(char *state_dir, size_t dir_len, char *state_file, size_t file_len) {
    const char *xdg = getenv("XDG_STATE_HOME");
    const char *home = getenv("HOME");

    if (xdg && strlen(xdg) > 0) {
        snprintf(state_dir, dir_len, "%s/getDate", xdg);
    } else if (home && strlen(home) > 0) {
        snprintf(state_dir, dir_len, "%s/.local/state/getDate", home);
    } else {
        snprintf(state_dir, dir_len, ".getDate_state");
    }

    snprintf(state_file, file_len, "%s/vars.env", state_dir);
}

int load_entries(const char *state_file, Entry entries[], int max_entries) {
    FILE *fp = fopen(state_file, "r");
    if (!fp) return 0;

    int count = 0;
    char line[MAX_LINE];
    while (fgets(line, sizeof(line), fp) && count < max_entries) {
        char *eq = strchr(line, '=');
        if (!eq) continue;

        *eq = '\0';
        char *key = line;
        char *value = eq + 1;

        size_t vlen = strlen(value);
        while (vlen > 0 && (value[vlen - 1] == '\n' || value[vlen - 1] == '\r')) {
            value[--vlen] = '\0';
        }

        strncpy(entries[count].key, key, sizeof(entries[count].key) - 1);
        entries[count].key[sizeof(entries[count].key) - 1] = '\0';
        strncpy(entries[count].value, value, sizeof(entries[count].value) - 1);
        entries[count].value[sizeof(entries[count].value) - 1] = '\0';
        count++;
    }

    fclose(fp);
    return count;
}

void save_entries(const char *state_file, Entry entries[], int count) {
    FILE *fp = fopen(state_file, "w");
    if (!fp) {
        fprintf(stderr, "Error: cannot write state file\n");
        exit(1);
    }

    for (int i = 0; i < count; i++) {
        fprintf(fp, "%s=%s\n", entries[i].key, entries[i].value);
    }

    fclose(fp);
}

void upsert_var(const char *state_file, const char *key, const char *value) {
    Entry entries[MAX_ENTRIES];
    int count = load_entries(state_file, entries, MAX_ENTRIES);

    for (int i = 0; i < count; i++) {
        if (strcmp(entries[i].key, key) == 0) {
            strncpy(entries[i].value, value, sizeof(entries[i].value) - 1);
            entries[i].value[sizeof(entries[i].value) - 1] = '\0';
            save_entries(state_file, entries, count);
            return;
        }
    }

    if (count < MAX_ENTRIES) {
        strncpy(entries[count].key, key, sizeof(entries[count].key) - 1);
        entries[count].key[sizeof(entries[count].key) - 1] = '\0';
        strncpy(entries[count].value, value, sizeof(entries[count].value) - 1);
        entries[count].value[sizeof(entries[count].value) - 1] = '\0';
        count++;
        save_entries(state_file, entries, count);
    }
}

void clear_vars(const char *state_file) {
    FILE *fp = fopen(state_file, "w");
    if (!fp) {
        fprintf(stderr, "Error: cannot clear state file\n");
        exit(1);
    }
    fclose(fp);
}

int has_flag(int argc, char *argv[], const char *flag) {
    for (int i = 1; i < argc; i++) {
        if (strcmp(argv[i], flag) == 0) return 1;
    }
    return 0;
}

int main(int argc, char *argv[]) {
    if (has_flag(argc, argv, "/?")) {
        show_help();
        if (has_flag(argc, argv, "-e")) {
            printf("Edit hint: open getDate.c to edit help text\n");
        }
        return 0;
    }

    if (has_flag(argc, argv, "--edit-all")) {
        printf("Edit hint: edit getDate.c and your root documentation markdown.\n");
        return 0;
    }

    char state_dir[512];
    char state_file[768];
    build_paths(state_dir, sizeof(state_dir), state_file, sizeof(state_file));

    struct stat st;
    if (stat(state_dir, &st) != 0) {
        if (ensure_dir(state_dir) != 0 && errno != EEXIST) {
            fprintf(stderr, "Error: cannot create state directory\n");
            return 1;
        }
    }

    FILE *check = fopen(state_file, "a");
    if (!check) {
        fprintf(stderr, "Error: cannot initialize state file\n");
        return 1;
    }
    fclose(check);

    int output_mode = 1;
    for (int i = 1; i < argc; i++) {
        if (strcmp(argv[i], "0") == 0 || strcmp(argv[i], "1") == 0) {
            output_mode = atoi(argv[i]);
        }
    }

    if (has_flag(argc, argv, "--clear-var")) {
        clear_vars(state_file);
        if (output_mode == 1) printf("Cleared getDate variables\n");
        return 0;
    }

    time_t now = time(NULL);
    struct tm *t = localtime(&now);

    int day = t->tm_mday;
    int month = t->tm_mon + 1;
    int year = t->tm_year + 1900;

    char dd[3], mm[3], yyyy[5], yy[3];
    snprintf(dd, sizeof(dd), "%02d", day);
    snprintf(mm, sizeof(mm), "%02d", month);
    snprintf(yyyy, sizeof(yyyy), "%04d", year);
    snprintf(yy, sizeof(yy), "%02d", year % 100);

    const char *month_name = MONTHS[month - 1];
    char month_abbr[4];
    strncpy(month_abbr, month_name, 3);
    month_abbr[3] = '\0';

    int quarter = ((month - 1) / 3) + 1;
    const char *season = SEASONS[quarter - 1];
    const char *last_month_name = MONTHS[(month + 10) % 12];
    int last_year = year - 1;
    int next_year = year + 1;
    int last_quarter = (quarter == 1) ? 4 : quarter - 1;

    if (has_flag(argc, argv, "--leap")) {
        char leap[2];
        snprintf(leap, sizeof(leap), "%d", is_leap(year));
        upsert_var(state_file, "_checkLeapYear", leap);
        if (output_mode == 1) printf("%s\n", leap);
        return 0;
    }

    char opts[MAX_ARGS][8];
    int opt_count = 0;
    char order_flag[16] = "";
    char slash_var[128] = "";

    for (int i = 1; i < argc; i++) {
        if (argv[i][0] == '/' && strcmp(argv[i], "/?") != 0) {
            split_option(argv[i], opts, &opt_count);
        } else if (strlen(argv[i]) == 6 && argv[i][0] == '-' && argv[i][2] == '-' && argv[i][4] == '-') {
            strncpy(order_flag, argv[i], sizeof(order_flag) - 1);
            order_flag[sizeof(order_flag) - 1] = '\0';
        } else if (argv[i][0] != '-' && argv[i][0] != '/' && strcmp(argv[i], "0") != 0 && strcmp(argv[i], "1") != 0) {
            strncpy(slash_var, argv[i], sizeof(slash_var) - 1);
            slash_var[sizeof(slash_var) - 1] = '\0';
        }
    }

    if (opt_count == 0) {
        const char *sep = has_flag(argc, argv, "--slash") ? "/" : "-";
        const char *year_part = has_flag(argc, argv, "--full") ? yyyy : yy;
        const char *var_name = has_flag(argc, argv, "--full") ? "_getFullDate" : "_getDate";

        if (has_flag(argc, argv, "--slash")) {
            if (has_flag(argc, argv, "-v") && strlen(slash_var) == 0) {
                var_name = "_getSlashDate";
            } else if (strlen(slash_var) > 0) {
                var_name = slash_var;
            }
        }

        char default_date[32];
        snprintf(default_date, sizeof(default_date), "%s%s%s%s%s", mm, sep, dd, sep, year_part);
        upsert_var(state_file, var_name, default_date);
        if (output_mode == 1) printf("%s\n", default_date);
        return 0;
    }

    int count_day = 0, count_month = 0, count_quarter = 0, count_year = 0;
    int has_d = 0, has_dm = 0;

    for (int i = 0; i < opt_count; i++) {
        if (strcmp(opts[i], "/D") == 0 || strcmp(opts[i], "/DM") == 0) count_day++;
        if (strcmp(opts[i], "/M") == 0 || strcmp(opts[i], "/LM") == 0) count_month++;
        if (strcmp(opts[i], "/Q") == 0 || strcmp(opts[i], "/LQ") == 0) count_quarter++;
        if (strcmp(opts[i], "/Y") == 0 || strcmp(opts[i], "/LY") == 0 || strcmp(opts[i], "/NY") == 0) count_year++;
        if (strcmp(opts[i], "/D") == 0) has_d = 1;
        if (strcmp(opts[i], "/DM") == 0) has_dm = 1;
    }

    if (count_day > 1 || count_month > 1 || count_quarter > 1 || count_year > 1) {
        int allow_day_pair = (count_day == 2 && has_d && has_dm);
        if (!(allow_day_pair && count_month <= 1 && count_quarter <= 1 && count_year <= 1)) {
            fprintf(stderr, "Error: only one option per date type is allowed\n");
            return 1;
        }
    }

    if (opt_count > 1) {
        for (int i = 0; i < opt_count; i++) {
            if (strcmp(opts[i], "/LQ") == 0 || strcmp(opts[i], "/NY") == 0 || strcmp(opts[i], "/T") == 0) {
                fprintf(stderr, "Error: %s must be used by itself\n", opts[i]);
                return 1;
            }
        }
    }

    if (has_dm && !has_d) {
        fprintf(stderr, "Error: /DM only works with /D\n");
        return 1;
    }

    char outputs[1024] = "";

    for (int i = 0; i < opt_count; i++) {
        if (strcmp(opts[i], "/D") == 0) {
            upsert_var(state_file, "_theTwoDigitDate", dd);
            strcat(outputs, dd);
            strcat(outputs, " ");
        } else if (strcmp(opts[i], "/DM") == 0) {
            upsert_var(state_file, "_theMonth", mm);
            strcat(outputs, mm);
            strcat(outputs, " ");
        } else if (strcmp(opts[i], "/LM") == 0) {
            upsert_var(state_file, "_lastMonth", last_month_name);
            strcat(outputs, last_month_name);
            strcat(outputs, " ");
        } else if (strcmp(opts[i], "/LQ") == 0) {
            char q[8];
            snprintf(q, sizeof(q), "Q%d", last_quarter);
            upsert_var(state_file, "_theQuarter", q);
            strcat(outputs, q);
            strcat(outputs, " ");
        } else if (strcmp(opts[i], "/LY") == 0) {
            char v[8];
            snprintf(v, sizeof(v), "%d", last_year);
            upsert_var(state_file, "_theYear", v);
            strcat(outputs, v);
            strcat(outputs, " ");
        } else if (strcmp(opts[i], "/M") == 0) {
            const char *v = has_flag(argc, argv, "-abbrv") ? month_abbr : month_name;
            upsert_var(state_file, "_theMonth", v);
            strcat(outputs, v);
            strcat(outputs, " ");
        } else if (strcmp(opts[i], "/NY") == 0) {
            char v[8];
            snprintf(v, sizeof(v), "%d", next_year);
            upsert_var(state_file, "_theYear", v);
            strcat(outputs, v);
            strcat(outputs, " ");
        } else if (strcmp(opts[i], "/Q") == 0) {
            char v[16];
            if (has_flag(argc, argv, "--season")) {
                snprintf(v, sizeof(v), "%s", season);
            } else {
                snprintf(v, sizeof(v), "Q%d", quarter);
            }
            upsert_var(state_file, "_theQuarter", v);
            strcat(outputs, v);
            strcat(outputs, " ");
        } else if (strcmp(opts[i], "/T") == 0) {
            char tval[32];
            if (strlen(order_flag) == 6) {
                char a = order_flag[1], b = order_flag[3], c = order_flag[5];
                const char *pa = (a == 'd') ? dd : (a == 'y') ? yyyy : mm;
                const char *pb = (b == 'd') ? dd : (b == 'y') ? yyyy : mm;
                const char *pc = (c == 'd') ? dd : (c == 'y') ? yyyy : mm;
                snprintf(tval, sizeof(tval), "%s/%s/%s", pa, pb, pc);
            } else {
                snprintf(tval, sizeof(tval), "%s/%s/%s", mm, dd, yyyy);
            }
            strcat(outputs, tval);
            strcat(outputs, " ");
        } else if (strcmp(opts[i], "/Y") == 0) {
            const char *v = (has_flag(argc, argv, "-t") || has_flag(argc, argv, "--two-digit")) ? yy : yyyy;
            upsert_var(state_file, "_theYear", v);
            strcat(outputs, v);
            strcat(outputs, " ");
        } else {
            fprintf(stderr, "Error: unknown option %s\n", opts[i]);
            return 1;
        }
    }

    if (output_mode == 1) {
        size_t len = strlen(outputs);
        if (len > 0 && outputs[len - 1] == ' ') outputs[len - 1] = '\0';
        if (strlen(outputs) > 0) printf("%s\n", outputs);
    }

    return 0;
}
