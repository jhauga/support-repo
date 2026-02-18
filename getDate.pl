#!/usr/bin/env perl
use strict;
use warnings;
use POSIX qw(strftime);
use File::Path qw(make_path);

my $state_dir = $ENV{XDG_STATE_HOME} ? "$ENV{XDG_STATE_HOME}/getDate" : "$ENV{HOME}/.local/state/getDate";
my $state_file = "$state_dir/vars.env";

sub ensure_state {
  make_path($state_dir) unless -d $state_dir;
  if (!-e $state_file) {
    open my $fh, '>', $state_file or die "Cannot create state file: $!";
    close $fh;
  }
}

sub load_vars {
  ensure_state();
  my %vars;
  open my $fh, '<', $state_file or die "Cannot open state file: $!";
  while (my $line = <$fh>) {
    chomp $line;
    next unless $line =~ /=/;
    my ($k, $v) = split(/=/, $line, 2);
    $vars{$k} = $v;
  }
  close $fh;
  return %vars;
}

sub save_vars {
  my (%vars) = @_;
  ensure_state();
  open my $fh, '>', $state_file or die "Cannot write state file: $!";
  foreach my $k (sort keys %vars) {
    print $fh "$k=$vars{$k}\n";
  }
  close $fh;
}

sub upsert_var {
  my ($key, $value) = @_;
  my %vars = load_vars();
  $vars{$key} = $value;
  save_vars(%vars);
}

sub clear_vars {
  ensure_state();
  open my $fh, '>', $state_file or die "Cannot clear state file: $!";
  close $fh;
}

sub is_leap {
  my ($year) = @_;
  return (($year % 400 == 0) || ($year % 4 == 0 && $year % 100 != 0)) ? 1 : 0;
}

sub show_help {
print <<'EOF';
getDate - get formatted date values and persist named variables

Usage:
  getDate.pl [options] [0|1]

Date options:
  /D   Day of month (two digits)
  /DM  Month as two digits (only valid with /D)
  /LM  Last month name
  /LQ  Last quarter (must be used alone)
  /LY  Last year (4-digit)
  /M   Current month name
  /NY  Next year (must be used alone)
  /Q   Current quarter
  /T   Terminal date format MM/DD/YYYY (must be used alone)
  /Y   Current year (4-digit, or 2-digit with -t/--two-digit)

Flags:
  --full        Default format uses YYYY (MM-DD-YYYY)
  --slash       Default format uses / instead of -
  --leap        Store leap check result in _checkLeapYear
  --clear-var   Clear persisted getDate variables
  -abbrv        Abbreviate month name (for /M)
  -t, --two-digit  Two-digit year when used with /Y
  --season      Use season name with /Q
  -v [var]      With --slash default mode, use _getSlashDate or custom var name
  /?            Show help
  -e            With /? display edit hint
EOF
}

my @months = qw(January February March April May June July August September October November December);
my @seasons = qw(Winter Spring Summer Fall);
my @args = @ARGV;

if (grep { $_ eq '/?' } @args) {
  show_help();
  if (grep { $_ eq '-e' } @args) {
    print "Edit hint: open getDate.pl to edit help text\n";
  }
  exit 0;
}

if (grep { $_ eq '--edit-all' } @args) {
  print "Edit hint: edit getDate.pl and your root documentation markdown.\n";
  exit 0;
}

my $output_mode = 1;
for my $a (@args) {
  if ($a eq '0' || $a eq '1') { $output_mode = $a; }
}

if (grep { $_ eq '--clear-var' } @args) {
  clear_vars();
  print "Cleared getDate variables\n" if $output_mode == 1;
  exit 0;
}

my ($sec, $min, $hour, $mday, $mon, $year) = localtime();
$year += 1900;
$mon += 1;

my $dd = sprintf('%02d', $mday);
my $mm = sprintf('%02d', $mon);
my $yyyy = sprintf('%04d', $year);
my $yy = sprintf('%02d', $year % 100);
my $month_name = $months[$mon - 1];
my $month_abbr = substr($month_name, 0, 3);
my $quarter = int(($mon - 1) / 3) + 1;
my $season = $seasons[$quarter - 1];
my $last_month_name = $months[($mon + 10) % 12];
my $last_year = $year - 1;
my $next_year = $year + 1;
my $last_quarter = $quarter == 1 ? 4 : $quarter - 1;

if (grep { $_ eq '--leap' } @args) {
  my $leap = is_leap($year);
  upsert_var('_checkLeapYear', "$leap");
  print "$leap\n" if $output_mode == 1;
  exit 0;
}

my @opts;
my $order_flag = '';
my $slash_var = '';
for my $a (@args) {
  if ($a =~ m{^/} && $a ne '/?') {
    if ($a =~ m{^/.+/}) {
      my @parts = grep { length $_ } split('/', $a);
      push @opts, map { "/$_" } @parts;
    } else {
      push @opts, $a;
    }
  } elsif ($a =~ /^-[dmy]-[dmy]-[dmy]$/) {
    $order_flag = $a;
  } elsif ($a !~ /^-/ && $a !~ m{^/} && $a ne '0' && $a ne '1') {
    $slash_var = $a;
  }
}

if (!@opts) {
  my $sep = (grep { $_ eq '--slash' } @args) ? '/' : '-';
  my $year_part = (grep { $_ eq '--full' } @args) ? $yyyy : $yy;
  my $var_name = (grep { $_ eq '--full' } @args) ? '_getFullDate' : '_getDate';

  if (grep { $_ eq '--slash' } @args) {
    if ((grep { $_ eq '-v' } @args) && !$slash_var) {
      $var_name = '_getSlashDate';
    } elsif ($slash_var) {
      $var_name = $slash_var;
    }
  }

  my $default_date = "$mm$sep$dd$sep$year_part";
  upsert_var($var_name, $default_date);
  print "$default_date\n" if $output_mode == 1;
  exit 0;
}

my $count_day = 0;
my $count_month = 0;
my $count_quarter = 0;
my $count_year = 0;
for my $o (@opts) {
  $count_day++ if $o eq '/D' || $o eq '/DM';
  $count_month++ if $o eq '/M' || $o eq '/LM';
  $count_quarter++ if $o eq '/Q' || $o eq '/LQ';
  $count_year++ if $o eq '/Y' || $o eq '/LY' || $o eq '/NY';
}

if ($count_day > 1 || $count_month > 1 || $count_quarter > 1 || $count_year > 1) {
  my $allow_day_pair = ($count_day == 2 && (grep { $_ eq '/D' } @opts) && (grep { $_ eq '/DM' } @opts));
  if (!($allow_day_pair && $count_month <= 1 && $count_quarter <= 1 && $count_year <= 1)) {
    print STDERR "Error: only one option per date type is allowed\n";
    exit 1;
  }
}

if (@opts > 1) {
  for my $o (@opts) {
    if ($o eq '/LQ' || $o eq '/NY' || $o eq '/T') {
      print STDERR "Error: $o must be used by itself\n";
      exit 1;
    }
  }
}

my $has_d = scalar grep { $_ eq '/D' } @opts;
my $has_dm = scalar grep { $_ eq '/DM' } @opts;
if ($has_dm && !$has_d) {
  print STDERR "Error: /DM only works with /D\n";
  exit 1;
}

my @outputs;
for my $o (@opts) {
  if ($o eq '/D') {
    upsert_var('_theTwoDigitDate', $dd);
    push @outputs, $dd;
  } elsif ($o eq '/DM') {
    upsert_var('_theMonth', $mm);
    push @outputs, $mm;
  } elsif ($o eq '/LM') {
    upsert_var('_lastMonth', $last_month_name);
    push @outputs, $last_month_name;
  } elsif ($o eq '/LQ') {
    my $v = 'Q' . $last_quarter;
    upsert_var('_theQuarter', $v);
    push @outputs, $v;
  } elsif ($o eq '/LY') {
    upsert_var('_theYear', "$last_year");
    push @outputs, "$last_year";
  } elsif ($o eq '/M') {
    my $v = (grep { $_ eq '-abbrv' } @args) ? $month_abbr : $month_name;
    upsert_var('_theMonth', $v);
    push @outputs, $v;
  } elsif ($o eq '/NY') {
    upsert_var('_theYear', "$next_year");
    push @outputs, "$next_year";
  } elsif ($o eq '/Q') {
    my $qval = (grep { $_ eq '--season' } @args) ? $season : 'Q' . $quarter;
    upsert_var('_theQuarter', $qval);
    push @outputs, $qval;
  } elsif ($o eq '/T') {
    my %parts = (d => $dd, m => $mm, y => $yyyy);
    my @order = ('m', 'd', 'y');
    if ($order_flag) {
      @order = split('-', substr($order_flag, 1));
    }
    my $tval = join('/', map { $parts{$_} // $mm } @order);
    push @outputs, $tval;
  } elsif ($o eq '/Y') {
    my $two = scalar grep { $_ eq '-t' || $_ eq '--two-digit' } @args;
    my $v = $two ? $yy : $yyyy;
    upsert_var('_theYear', $v);
    push @outputs, $v;
  } else {
    print STDERR "Error: unknown option $o\n";
    exit 1;
  }
}

if ($output_mode == 1 && @outputs) {
  print join(' ', @outputs) . "\n";
}

exit 0;
