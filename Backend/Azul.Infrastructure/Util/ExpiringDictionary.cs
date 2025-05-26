using System.Collections.Concurrent;

namespace Azul.Infrastructure.Util;

public class ExpiringDictionary<TKey, TValue> where TKey : notnull
{
    private readonly TimeSpan _entryLifeSpan;
    private readonly ConcurrentDictionary<TKey, Entry> _entries;
    private DateTimeOffset _lastExpirationScan;

    public IReadOnlyList<TValue> Values
    {
        get
        {
            var now = DateTimeOffset.Now;
            Console.WriteLine($"[VALUES] Checking {_entries.Count} entries at {now}");
            var validEntries = _entries.Values
                .Where(entry => !entry.IsExpired(now))
                .Select(entry => entry.Value)
                .ToList();
            Console.WriteLine($"[VALUES] Found {validEntries.Count} valid entries out of {_entries.Count} total");
            return validEntries;
        }
    }

    public ExpiringDictionary()
    {
        _entries = new ConcurrentDictionary<TKey, Entry>();
        _entryLifeSpan = TimeSpan.FromSeconds(180);
    }

    public ExpiringDictionary(TimeSpan entryLifeSpan)
    {
        _entryLifeSpan = entryLifeSpan;
        _entries = new ConcurrentDictionary<TKey, Entry>();
    }

    public void AddOrReplace(TKey key, TValue value)
    {
        Console.WriteLine($"[EXPIRING_DICT] Adding/Replacing key: {key}, LifeSpan: {_entryLifeSpan}");
        _entries.AddOrUpdate(key, k => new Entry(value, _entryLifeSpan), (k, oldValue) => new Entry(value, _entryLifeSpan));
        Console.WriteLine($"[EXPIRING_DICT] After add: Total entries: {_entries.Count}");
        // Don't scan on every add - this was causing immediate removal
        // StartScanForExpiredEntries();
    }

    public bool TryGetValue(TKey key, out TValue value)
    {
        bool result = false;
        value = default!;
        if (_entries.TryGetValue(key, out Entry? entry) && !entry.IsExpired(DateTimeOffset.Now))
        {
            value = entry.Value;
            result = true;
        }

        // Only scan occasionally, not on every access
        StartScanForExpiredEntries();

        return result;
    }

    public bool TryRemove(TKey key, out TValue removedValue)
    {
        if (_entries.TryRemove(key, out Entry? removedEntry))
        {
            removedValue = removedEntry.Value;
            return true;
        }

        removedValue = default!;
        return false;
    }

    private void StartScanForExpiredEntries()
    {
        var now = DateTimeOffset.Now;
        if (TimeSpan.FromSeconds(30) < now - _lastExpirationScan)
        {
            _lastExpirationScan = now;
            Task.Factory.StartNew(state => ScanForExpiredItems((ConcurrentDictionary<TKey, Entry>)state!), _entries,
                CancellationToken.None, TaskCreationOptions.DenyChildAttach, TaskScheduler.Default);
        }
    }

    private static void ScanForExpiredItems(ConcurrentDictionary<TKey, Entry> dictionary)
    {
        var now = DateTimeOffset.Now;
        Console.WriteLine($"[EXPIRING_DICT] Starting expiration scan. Total entries: {dictionary.Count}");
        int removedCount = 0;
        foreach (var keyValue in dictionary)
        {
            if (keyValue.Value.IsExpired(now))
            {
                Console.WriteLine($"[EXPIRING_DICT] Removing expired key: {keyValue.Key}");
                dictionary.TryRemove(keyValue.Key, out Entry? _);
                removedCount++;
            }
        }
        Console.WriteLine($"[EXPIRING_DICT] Expiration scan complete. Removed: {removedCount}, Remaining: {dictionary.Count}");
    }

    private class Entry
    {
        private readonly DateTimeOffset _expiration;

        public TValue Value { get; }

        public Entry(TValue value, TimeSpan lifeTime)
        {
            Value = value;
            _expiration = DateTimeOffset.Now.Add(lifeTime);
            Console.WriteLine($"[ENTRY] Created entry with expiration: {_expiration}, LifeTime: {lifeTime}");
        }

        public bool IsExpired(DateTimeOffset now)
        {
            bool expired = now >= _expiration;
            if (expired)
            {
                Console.WriteLine($"[ENTRY] Entry EXPIRED - Now: {now}, Expiration: {_expiration}, Diff: {now - _expiration}");
            }
            return expired;
        }
    }
}